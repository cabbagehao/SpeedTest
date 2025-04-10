// 下载速度测试模块

import { fetchWithThrottle, SPEED_TEST_SERVER, TEST_SIZES, DEBUG_MODE } from './speedTestConfig';
import { SpeedTestProgressCallback, SpeedDataPoint } from './speedTestTypes';
import { throttleSettings } from '../components/ThrottleTestSettings';

/**
 * 测试下载速度 - 改进版本，持续测试12秒
 */
export const testDownloadSpeed = async (
  onProgress: SpeedTestProgressCallback
): Promise<{ speed: number | null; dataPoints: SpeedDataPoint[] }> => {
  // 数据点记录
  const dataPoints: SpeedDataPoint[] = [];
  
  // 下载URL
  const downloadUrl = `${SPEED_TEST_SERVER.baseUrl}${SPEED_TEST_SERVER.endpoints.download}`;
  
  // 初始化测试配置
  const MIN_TEST_DURATION_MS = 10000; // 最小测试时间：10秒
  const MAX_TEST_DURATION_MS = 12000; // 最大测试时间：12秒
  const MIN_DATA_POINTS = 5; // 最小数据点数量
  const INTERVAL_CHECK_MS = 200; // 速度检查间隔：200毫秒
  
  // 预热连接
  onProgress('download', 0, 0, []);
  try {
    await fetchWithThrottle(`${downloadUrl}?size=xs&cb=${Date.now()}`, { 
      method: 'HEAD',
      cache: 'no-store'
    });
  } catch (error) {
    console.error('预热连接失败:', error);
  }
  
  // 初始测试 - 确定连接速度范围
  onProgress('download', 5, undefined, dataPoints);
  let initialSpeed = 0;
  
  try {
    const cacheBuster = Date.now();
    const startTime = performance.now();
    const response = await fetchWithThrottle(`${downloadUrl}?size=${TEST_SIZES.S}&cb=${cacheBuster}`, { 
      cache: 'no-store'
    });
    const blob = await response.blob();
    const endTime = performance.now();
    
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    const fileSize = contentLength || blob.size;
    
    const durationInSeconds = (endTime - startTime) / 1000;
    const bitsLoaded = fileSize * 8;
    const speedBps = (bitsLoaded / durationInSeconds);
    const speedMbps = speedBps / (1024 * 1024);
    
    initialSpeed = speedMbps;
    
    // 添加数据点
    dataPoints.push({
      timestamp: Date.now(),
      speed: speedMbps
    });
    
    onProgress('download', 10, speedMbps, dataPoints);
  } catch (error) {
    console.error('初始速度测试失败:', error);
    return { speed: null, dataPoints: [] };
  }
  
  // 选择最适合的文件大小进行持续测试
  let testFileSize = TEST_SIZES.S;
  
  // 如果在开发环境中且启用了限速，优先使用指定的文件大小
  if (import.meta.env.MODE === 'development' && 
      throttleSettings.enabled && 
      throttleSettings.fileSize) {
    testFileSize = throttleSettings.fileSize;
    console.log(`[限速测试] 使用固定文件大小: ${testFileSize}`);
  } else {
    // 根据初始速度动态选择文件大小
    if (initialSpeed < 5) {
      testFileSize = TEST_SIZES.XS; // 低速连接
    } else if (initialSpeed < 20) {
      testFileSize = TEST_SIZES.S;  // 中速连接
    } else if (initialSpeed < 50) {
      testFileSize = TEST_SIZES.M;  // 高速连接
    } else if (initialSpeed < 200) {
      testFileSize = TEST_SIZES.L;  // 非常快的连接
    } else {
      testFileSize = TEST_SIZES.XL; // 超高速连接
    }
  }
  
  console.log(`根据初始速度 ${initialSpeed.toFixed(2)} Mbps 选择持续测试文件大小: ${testFileSize}`);
  
  // 持续测试 - 使用少量稳定连接下载大文件
  const testStartTime = performance.now();
  const speedSamples: number[] = []; 
  
  // 并发连接数（使用2个连接提高测试准确性，但不会导致结果翻倍）
  const CONCURRENT_CONNECTIONS = 2; // 增加为2个并发连接，在网络不稳定时可以有更多的重试机会
  let totalBytesDownloaded = 0;
  let lastProgressUpdate = testStartTime;
  let testFinished = false;
  
  // 在测试过程中每200ms更新一次进度
  const updateInterval = setInterval(() => {
    const elapsedMs = performance.now() - testStartTime;
    // 线性进度，12秒内从10%到95%
    const progressPercent = Math.min(95, 10 + (elapsedMs / MAX_TEST_DURATION_MS) * 85);
    
    // 计算当前速度
    if (elapsedMs > 0 && totalBytesDownloaded > 0) {
      // 计算当前速度 - 注意不要因为有多个连接而导致结果翻倍
      // 测试速度 = 总下载字节数 × 8 / 总时间(秒) / 1024² (Mbps)
      let currentSpeedMbps = (totalBytesDownloaded * 8) / (elapsedMs / 1000) / (1024 * 1024);
      
      // 应用连接数校正因子 - 在限速环境下防止结果翻倍
      const connectionCorrectionFactor = throttleSettings.enabled ? CONCURRENT_CONNECTIONS : 1;
      currentSpeedMbps = currentSpeedMbps / connectionCorrectionFactor;
      
      // 只有在有意义的变化时才添加数据点
      const lastPoint = dataPoints[dataPoints.length - 1];
      const timeSinceLastUpdate = performance.now() - lastProgressUpdate;
      
      if (timeSinceLastUpdate >= INTERVAL_CHECK_MS) {
        if (!lastPoint || Math.abs(lastPoint.speed - currentSpeedMbps) > 0.5 || timeSinceLastUpdate >= 1000) {
          dataPoints.push({
            timestamp: Date.now(),
            speed: currentSpeedMbps
          });
          speedSamples.push(currentSpeedMbps);
          lastProgressUpdate = performance.now();
        }
      }
      
      onProgress('download', progressPercent, currentSpeedMbps, dataPoints);
    }
    
    // 检查是否达到最大测试时间
    if (elapsedMs >= MAX_TEST_DURATION_MS && !testFinished) {
      testFinished = true;
      clearInterval(updateInterval);
    }
  }, INTERVAL_CHECK_MS);
  
  // 定义最大重试次数和请求超时时间
  const MAX_RETRIES = 3;
  const REQUEST_TIMEOUT_MS = 10000; // 10秒请求超时

  // 函数用于创建下载任务
  const createDownloadTask = async (
    serverUrl: string,
    onProgress?: SpeedTestProgressCallback,
    chunkSize?: number
  ): Promise<void> => {
    let testFinished = false;
    let retryCount = 0;
    const connectionId = Math.floor(Math.random() * 1000); // 为了日志调试
    const testStartTime = performance.now();
    
    const tryDownload = async (): Promise<void> => {
      try {
        // 使用 AbortController 设置请求超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        
        // 构建请求，添加信号和连接ID
        const actualChunkSize = chunkSize || TEST_SIZES.XL; // 使用默认的XL大小
        const downloadRequestUrl = `${serverUrl}?size=${actualChunkSize}&cid=${connectionId}`;
        const response = await fetchWithThrottle(downloadRequestUrl, { signal: controller.signal });
        clearTimeout(timeoutId); // 清除超时
        
        const reader = response.body?.getReader();
        if (!reader) throw new Error('无法获取响应流');
        
        // 流式读取响应
        while (true) {
          // 如果测试已结束，停止读取
          if (testFinished) {
            reader.releaseLock();
            return;
          }
          
          const { done, value } = await reader.read();
          
          if (done) {
            // 如果一个文件下载完成了，但测试还没达到最小时间，则创建新的下载
            const elapsedMs = performance.now() - testStartTime;
            if (elapsedMs < MIN_TEST_DURATION_MS && !testFinished) {
              console.log(`连接 #${connectionId} 下载完成，但测试时间(${(elapsedMs/1000).toFixed(1)}秒)未达到最小要求(${MIN_TEST_DURATION_MS/1000}秒)，继续下载新文件...`);
              reader.releaseLock();
              // 递归调用自身，创建新的下载连接
              return createDownloadTask(serverUrl, onProgress, chunkSize);
            }
            break;
          }
          
          // 累计下载的字节数
          if (value) {
            totalBytesDownloaded += value.length;
          }
          
          // 检查测试时间
          const elapsedMs = performance.now() - testStartTime;
          if (elapsedMs >= MAX_TEST_DURATION_MS) {
            // 如果达到最大测试时间，主动中断
            reader.releaseLock();
            if (!testFinished) {
              testFinished = true;
              return;
            }
          }
        }
        
        reader.releaseLock();
      } catch (error) {
        // 确保记录详细的错误信息
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`下载任务失败 (连接 #${connectionId}): ${errorMessage}`);
        
        // 重试逻辑 - 简化条件，只要未达到最大重试次数就继续尝试
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`下载失败，尝试第 ${retryCount}/${MAX_RETRIES} 次重试...`);
          // 增加重试间隔，避免频繁请求对服务器造成压力
          await new Promise(resolve => setTimeout(resolve, 1000)); 
          return tryDownload(); // 返回重试调用
        } else {
          // 重试次数用尽
          console.warn(`重试次数已用尽(${MAX_RETRIES}次)，此连接将不再重试`);
          
          // 检查是否需要创建新的下载任务（只有在测试未结束时）
          if (!testFinished) {
            const elapsedMs = performance.now() - testStartTime;
            if (elapsedMs < MIN_TEST_DURATION_MS) {
              console.log('下载任务失败且重试次数用尽，但测试时间不足，创建新的下载任务...');
              // 短暂延迟后创建新任务
              await new Promise(resolve => setTimeout(resolve, 500));
              return createDownloadTask(serverUrl, onProgress, chunkSize);
            }
          }
        }
      }
    };
    
    await tryDownload();
  };
  
  // 启动固定数量的并发下载
  const downloadTasks: Promise<void>[] = [];
  for (let i = 0; i < CONCURRENT_CONNECTIONS; i++) {
    downloadTasks.push(createDownloadTask(downloadUrl, onProgress, testFileSize));
  }
  
  // 定义测试结束条件：要么所有任务完成，要么达到最小测试时间
  const testEndPromise = new Promise<void>((resolve) => {
    const checkInterval = setInterval(() => {
      const elapsedMs = performance.now() - testStartTime;
      // 如果已达到最小测试时间且有足够的数据点或已下载足够数据
      if (elapsedMs >= MIN_TEST_DURATION_MS && 
          (dataPoints.length >= MIN_DATA_POINTS || totalBytesDownloaded > 5 * 1024 * 1024)) {
        console.log(`达到测试结束条件: 已测试${(elapsedMs/1000).toFixed(1)}秒, 收集${dataPoints.length}个数据点, 下载${(totalBytesDownloaded/(1024*1024)).toFixed(2)}MB`);
        testFinished = true;
        clearInterval(checkInterval);
        clearInterval(updateInterval);
        // 确保进度显示为95%
        onProgress('download', 95, (totalBytesDownloaded * 8) / (elapsedMs / 1000) / (1024 * 1024) / (throttleSettings.enabled ? CONCURRENT_CONNECTIONS : 1), dataPoints);
        resolve();
      } else if (testFinished) {
        clearInterval(checkInterval);
        resolve();
      } 
      // 添加超时保护，避免无限等待
      else if (elapsedMs >= MAX_TEST_DURATION_MS * 1.2) {
        console.warn('下载测试超时，强制结束');
        testFinished = true;
        clearInterval(checkInterval);
        clearInterval(updateInterval);
        // 确保进度显示为95%
        onProgress('download', 95, (totalBytesDownloaded * 8) / (elapsedMs / 1000) / (1024 * 1024) / (throttleSettings.enabled ? CONCURRENT_CONNECTIONS : 1), dataPoints);
        resolve();
      }
    }, 500);
  });
  
  // 等待测试结束
  await Promise.race([
    Promise.all(downloadTasks),
    testEndPromise
  ]);
  
  // 确保更新间隔已清除
  clearInterval(updateInterval);
  
  // 主动终止测试
  testFinished = true;
  
  // 分析数据，计算最终速度
  const testDurationSec = (performance.now() - testStartTime) / 1000;
  // 当使用多连接时，除以连接数以获得更准确的结果
  // 在限速环境下，多连接会绕过单连接限速导致结果翻倍
  const connectionCorrectionFactor = throttleSettings.enabled ? CONCURRENT_CONNECTIONS : 1;

  // 添加更详细的日志以便于分析
  const rawSpeed = (totalBytesDownloaded * 8) / testDurationSec / (1024 * 1024);
  const correctedSpeed = rawSpeed / connectionCorrectionFactor;

  console.log(`测速完成，总测试时间: ${testDurationSec.toFixed(2)}秒, 总下载: ${(totalBytesDownloaded / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`原始速率: ${rawSpeed.toFixed(2)} Mbps, 连接数: ${CONCURRENT_CONNECTIONS}, 校正因子: ${connectionCorrectionFactor}, 校正后速率: ${correctedSpeed.toFixed(2)} Mbps`);

  // 使用多种统计方法计算速度
  let finalSpeed: number | null = null;
  
  if (speedSamples.length > 0) {
    // 方法1: 从总字节数和总时间计算 - 最基础的计算方式，应用连接数校正
    const overallSpeedMbps = correctedSpeed;
    
    // 方法2: 稳定区间内的平均速度（排除启动和结束阶段）
    let stableSpeedSamples = speedSamples.map(speed => speed / connectionCorrectionFactor);
    if (stableSpeedSamples.length >= 10) {
      // 排序后去除最低的20%和最高的20%的样本
      stableSpeedSamples = [...stableSpeedSamples].sort((a, b) => a - b);
      const cutoff = Math.floor(stableSpeedSamples.length * 0.2);
      stableSpeedSamples = stableSpeedSamples.slice(cutoff, stableSpeedSamples.length - cutoff);
    }
    
    const avgStableSpeed = stableSpeedSamples.reduce((sum, speed) => sum + speed, 0) / stableSpeedSamples.length;
    
    // 方法3: 计算第75百分位速度（更能反映用户实际体验）
    const p75SpeedIndex = Math.floor(stableSpeedSamples.length * 0.75);
    const p75Speed = [...stableSpeedSamples].sort((a, b) => a - b)[p75SpeedIndex];
    
    console.log(`校正后整体速度: ${overallSpeedMbps.toFixed(2)} Mbps, 校正后稳定区间平均: ${avgStableSpeed.toFixed(2)} Mbps, 校正后P75: ${p75Speed?.toFixed(2)} Mbps (由${speedSamples.length}个样本计算)`);
    
    // 最终使用稳定区间内的平均速度作为结果
    finalSpeed = Number(avgStableSpeed.toFixed(2));
  }
  
  onProgress('download', 100, finalSpeed || 0, dataPoints);
  
  return { speed: finalSpeed, dataPoints };
}; 