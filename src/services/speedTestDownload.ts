// 下载速度测试模块

import { fetchWithThrottle, SPEED_TEST_SERVER, TEST_SIZES, DEBUG_MODE } from './speedTestConfig';
import { SpeedTestProgressCallback, SpeedDataPoint } from './speedTestTypes';

// 定义默认限速设置对象
const defaultThrottleSettings = {
  enabled: false,
  fileSize: TEST_SIZES.S,
  throttleKBps: 0
};

// 获取限速设置，如果不存在则使用默认值
const getThrottleSettings = () => {
  // @ts-ignore - 这里忽略类型检查，因为throttleSettings可能在全局上下文中定义
  return (typeof throttleSettings !== 'undefined' ? throttleSettings : defaultThrottleSettings);
};

/**
 * 测试下载速度 - 改进版本，持续测试12-15秒
 */
export const testDownloadSpeed = async (
  onProgress: SpeedTestProgressCallback
): Promise<{ speed: number | null; dataPoints: SpeedDataPoint[] }> => {
  // 数据点记录
  const dataPoints: SpeedDataPoint[] = [];
  
  // 下载URL
  const downloadUrl = `${SPEED_TEST_SERVER.baseUrl}${SPEED_TEST_SERVER.endpoints.download}`;
  
  // 初始化测试配置
  const MIN_TEST_DURATION_MS = 12000; // 最小测试时间：12秒
  const MAX_TEST_DURATION_MS = 15000; // 最大测试时间：15秒 (最小+3秒)
  const MIN_DATA_POINTS = 5; // 最小数据点数量
  const INTERVAL_CHECK_MS = 100; // 速度检查间隔：0.1秒
  const CONNECTION_TIMEOUT_MS = 2000; // 连接超时时间：2秒
  const RETRY_DELAY_MS = 1000; // 重试延迟：1秒
  
  // 用于跟踪活跃连接数和正确取消测试
  const testControl = {
    isFinished: false,
    activeConnections: 0,
    totalBytesDownloaded: 0,
    lastProgressUpdate: 0
  };
  
  console.log(`[Download] 开始下载测试 ${new Date().toISOString()}`);
  
  // 预热连接
  onProgress('download', 0, 0, []);
  try {
    await fetchWithThrottle(`${downloadUrl}?size=xs&cb=${Date.now()}`, { 
      method: 'HEAD',
      cache: 'no-store'
    });
  } catch (error) {
    console.error('[Download] 预热连接失败:', error);
  }
  
  // 初始测试 - 确定连接速度范围
  onProgress('download', 5, undefined, dataPoints);
  let initialSpeed = 0;
  
  try {
    const cacheBuster = Date.now();
    console.log(`[Download] 执行初速测试 ${new Date().toISOString()}`);
    const startTime = performance.now();
    
    // 创建AbortController用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT_MS);
    
    const response = await fetchWithThrottle(`${downloadUrl}?size=${TEST_SIZES.S}&cb=${cacheBuster}`, { 
      cache: 'no-store',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const blob = await response.blob();
    const endTime = performance.now();
    
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    const fileSize = contentLength || blob.size;
    
    const durationInSeconds = (endTime - startTime) / 1000;
    const bitsLoaded = fileSize * 8;
    const speedBps = (bitsLoaded / durationInSeconds);
    const speedMbps = speedBps / (1024 * 1024);
    
    initialSpeed = speedMbps;
    console.log(`[Download] 初速测试完成: ${initialSpeed.toFixed(2)} Mbps, 时间: ${new Date().toISOString()}`);
    
    // 添加数据点
    dataPoints.push({
      timestamp: Date.now(),
      speed: speedMbps
    });
    
    onProgress('download', 10, speedMbps, dataPoints);
  } catch (error) {
    console.error('[Download] 初始速度测试失败:', error);
    return { speed: null, dataPoints: [] };
  }
  
  // 选择最适合的文件大小进行持续测试
  let testFileSize = TEST_SIZES.S;
  
  // 获取限速设置
  const throttleSettings = getThrottleSettings();
  
  // 如果在开发环境中且启用了限速，优先使用指定的文件大小
  if (import.meta.env.MODE === 'development' && 
      throttleSettings.enabled && 
      throttleSettings.fileSize) {
    testFileSize = throttleSettings.fileSize;
    console.log(`[Download][限速测试] 使用固定文件大小: ${testFileSize}`);
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
  
  console.log(`[Download] 根据初始速度 ${initialSpeed.toFixed(2)} Mbps 选择持续测试文件大小: ${testFileSize}`);
  
  // 持续测试 - 使用少量稳定连接下载大文件
  const testStartTime = performance.now();
  const speedSamples: number[] = []; 
  
  // 并发连接数 - 使用2个并发连接
  const CONCURRENT_CONNECTIONS = 2; // 固定为2个并发连接
  let totalBytesDownloaded = 0;
  let lastProgressUpdate = testStartTime;
  let testFinished = false;
  
  console.log(`[Download] 开始持续测试，时间: ${new Date().toISOString()}, 并发连接数: ${CONCURRENT_CONNECTIONS}`);
  
  // 在测试过程中每100ms更新一次进度
  const updateInterval = setInterval(() => {
    const elapsedMs = performance.now() - testStartTime;
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
        const timestamp = Date.now();
        console.log(`[Download] 速度更新: ${currentSpeedMbps.toFixed(2)} Mbps, 时间: ${new Date(timestamp).toISOString()}, 时间间隔: ${timeSinceLastUpdate.toFixed(0)}ms`);
        
        if (!lastPoint || Math.abs(lastPoint.speed - currentSpeedMbps) > 0.5 || timeSinceLastUpdate >= 1000) {
          dataPoints.push({
            timestamp,
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
      console.log(`[Download] 达到最大测试时间 ${MAX_TEST_DURATION_MS}ms，结束测试`);
      testFinished = true;
      // 确保在下一个tick中清除定时器，避免在清除后又触发一次
      setTimeout(() => clearInterval(updateInterval), 0);
    }
  }, INTERVAL_CHECK_MS);
  
  // 创建一个下载任务 - 下载单个大文件而不是多个小文件
  const createDownloadTask = async (): Promise<void> => {
    if (testFinished) {
      console.log(`[Download] 测试已结束，不创建新的下载任务`);
      return;
    }
    
    testControl.activeConnections++;
    const connectionId = Math.floor(Math.random() * 1000);
    console.log(`[Download] 开始下载连接 #${connectionId}, 当前活跃连接: ${testControl.activeConnections}`);
    
    try {
      const cacheBuster = Date.now() + '-' + Math.random();
      // 大文件下载，添加标识符，便于调试
      
      // 创建AbortController用于取消请求
      const controller = new AbortController();
      const signal = controller.signal;

      // 发送请求（考虑限速设置）
      let response;
      try {
        if (import.meta.env.MODE === 'development' && 
            throttleSettings.enabled && 
            throttleSettings.throttleKBps > 0) {
          // 应用限速
          const throttleKBps = throttleSettings.throttleKBps;
          const throttledUrl = `${downloadUrl}?size=${testFileSize}&cb=${cacheBuster}&conn=${connectionId}&throttle=${throttleKBps}`;
          console.log(`[Download] 连接 #${connectionId} 请求限速URL: ${throttledUrl}`);
          
          // 设置超时
          const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT_MS);
          
          response = await fetch(throttledUrl, { 
            cache: 'no-store',
            signal 
          });
          clearTimeout(timeoutId);
        } else {
          // 无限速
          const url = `${downloadUrl}?size=${testFileSize}&cb=${cacheBuster}&conn=${connectionId}`;
          console.log(`[Download] 连接 #${connectionId} 请求URL: ${url}`);
          
          // 设置超时
          const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT_MS);
          
          response = await fetch(url, { 
            cache: 'no-store',
            signal
          });
          clearTimeout(timeoutId);
        }
      } catch (err) {
        if (testFinished) {
          console.log(`[Download] 连接 #${connectionId} 请求被中止，测试已结束`);
        } else {
          console.error(`[Download] 连接 #${connectionId} 请求失败:`, err);
        }
        testControl.activeConnections--;
        
        // 如果测试未结束，重试下载
        if (!testFinished) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          return createDownloadTask();
        }
        return;
      }
      
      // 检查响应状态
      if (!response.ok) {
        console.error(`[Download] 连接 #${connectionId} 下载请求失败，状态码: ${response.status}`);
        testControl.activeConnections--;
        
        // 如果测试未结束，重试下载
        if (!testFinished) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          return createDownloadTask();
        }
        return;
      }
      
      // 获取响应流
      const reader = response.body?.getReader();
      if (!reader) {
        console.error(`[Download] 连接 #${connectionId} 无法获取响应流`);
        testControl.activeConnections--;
        
        // 如果测试未结束，重试下载
        if (!testFinished) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          return createDownloadTask();
        }
        return;
      }
      
      // 读取数据流
      let done = false;
      
      // 监听测试结束
      const checkTestStatus = setInterval(() => {
        if (testFinished && !done) {
          console.log(`[Download] 连接 #${connectionId} 测试已结束，中止读取`);
          clearInterval(checkTestStatus);
          controller.abort(); // 中止请求
          reader.cancel(); // 取消读取
        }
      }, 100);
      
      while (!done) {
        // 检查测试是否已完成
        if (testFinished) {
          console.log(`[Download] 连接 #${connectionId} 检测到测试已完成，停止读取`);
          reader.cancel();
          clearInterval(checkTestStatus);
          break;
        }
        
        // 读取数据块
        try {
          const result = await reader.read();
          done = result.done;
          
          // 如果有数据，累计下载的字节数
          if (!done && result.value) {
            const bytes = result.value.length;
            totalBytesDownloaded += bytes;
            testControl.totalBytesDownloaded += bytes;
          }
        } catch (err) {
          if (testFinished) {
            console.log(`[Download] 连接 #${connectionId} 读取被中止，测试已结束`);
          } else {
            console.error(`[Download] 连接 #${connectionId} 读取失败:`, err);
          }
          done = true;
        }
        
        // 检查测试时间
        const elapsedMs = performance.now() - testStartTime;
        if (elapsedMs >= MAX_TEST_DURATION_MS) {
          // 如果达到最大测试时间，主动中断
          console.log(`[Download] 连接 #${connectionId} 达到最大测试时间，中断读取`);
          reader.cancel();
          clearInterval(checkTestStatus);
          if (!testFinished) {
            testFinished = true;
          }
          break;
        }
      }
      
      // 释放读取器和清除检查间隔
      reader.releaseLock();
      clearInterval(checkTestStatus);
      
      console.log(`[Download] 连接 #${connectionId} 完成读取，done=${done}, 测试状态=${testFinished ? '已结束' : '进行中'}`);
      testControl.activeConnections--;
      
      // 如果测试未完成，继续下载
      if (!testFinished) {
        const elapsedMs = performance.now() - testStartTime;
        console.log(`[Download] 连接 #${connectionId} 下载完成，测试时间: ${(elapsedMs/1000).toFixed(1)}秒, 开始新连接`);
        
        // 立即开始下一次请求
        return createDownloadTask();
      }
    } catch (error) {
      // 处理错误
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Download] 下载任务 #${connectionId} 失败: ${errorMessage}`);
      testControl.activeConnections--;
      
      // 如果测试未完成，重试下载
      if (!testFinished) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        return createDownloadTask();
      }
    }
  };
  
  // 启动固定数量的并发下载
  const downloadTasks: Promise<void>[] = [];
  for (let i = 0; i < CONCURRENT_CONNECTIONS; i++) {
    downloadTasks.push(createDownloadTask());
  }
  
  // 定义测试结束条件：要么所有任务完成，要么达到最小测试时间
  const testEndPromise = new Promise<void>((resolve) => {
    const checkInterval = setInterval(() => {
      const elapsedMs = performance.now() - testStartTime;
      // 如果已达到最小测试时间且有足够的数据点或已下载足够数据
      if (elapsedMs >= MIN_TEST_DURATION_MS && 
          (dataPoints.length >= MIN_DATA_POINTS || totalBytesDownloaded > 5 * 1024 * 1024)) {
        console.log(`[Download] 达到测试结束条件: 已测试${(elapsedMs/1000).toFixed(1)}秒, 收集${dataPoints.length}个数据点, 下载${(totalBytesDownloaded/(1024*1024)).toFixed(2)}MB`);
        testFinished = true;
        testControl.isFinished = true;
        clearInterval(checkInterval);
        resolve();
      } else if (testFinished) {
        testControl.isFinished = true;
        clearInterval(checkInterval);
        resolve();
      } 
      // 添加超时保护，避免无限等待
      else if (elapsedMs >= MAX_TEST_DURATION_MS) {
        console.warn('[Download] 下载测试超时，强制结束');
        testFinished = true;
        testControl.isFinished = true;
        clearInterval(checkInterval);
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
  testControl.isFinished = true;
  
  // 输出活跃连接数情况
  console.log(`[Download] 测试结束，仍有 ${testControl.activeConnections} 个活跃连接`);
  
  // 分析数据，计算最终速度
  const testDurationSec = (performance.now() - testStartTime) / 1000;
  // 当使用多连接时，除以连接数以获得更准确的结果
  // 在限速环境下，多连接会绕过单连接限速导致结果翻倍
  const connectionCorrectionFactor = throttleSettings.enabled ? CONCURRENT_CONNECTIONS : 1;

  // 添加更详细的日志以便于分析
  const rawSpeed = (totalBytesDownloaded * 8) / testDurationSec / (1024 * 1024);
  const correctedSpeed = rawSpeed / connectionCorrectionFactor;

  console.log(`[Download] 测速完成，总测试时间: ${testDurationSec.toFixed(2)}秒, 总下载: ${(totalBytesDownloaded / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`[Download] 原始速率: ${rawSpeed.toFixed(2)} Mbps, 连接数: ${CONCURRENT_CONNECTIONS}, 校正因子: ${connectionCorrectionFactor}, 校正后速率: ${correctedSpeed.toFixed(2)} Mbps`);

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
    
    console.log(`[Download] 校正后整体速度: ${overallSpeedMbps.toFixed(2)} Mbps, 校正后稳定区间平均: ${avgStableSpeed.toFixed(2)} Mbps, 校正后P75: ${p75Speed?.toFixed(2)} Mbps (由${speedSamples.length}个样本计算)`);
    
    // 最终使用稳定区间内的平均速度作为结果
    finalSpeed = Number(avgStableSpeed.toFixed(2));
  }
  
  // 最终进度报告
  onProgress('download', 100, finalSpeed || 0, dataPoints);
  
  return { speed: finalSpeed, dataPoints };
}; 