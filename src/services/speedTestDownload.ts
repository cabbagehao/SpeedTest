// 下载速度测试模块

import { fetchWithThrottle, SPEED_TEST_SERVER, TEST_SIZES, DEBUG_MODE } from './speedTestConfig';
import { SpeedTestProgressCallback, SpeedDataPoint } from './speedTestTypes';
import { throttleSettings } from '../components/ThrottleTestSettings';

/**
 * 测试下载速度 - 完全重写版本
 */
export const testDownloadSpeed = async (
  onProgress: SpeedTestProgressCallback
): Promise<{ speed: number | null; dataPoints: SpeedDataPoint[] }> => {
  // 数据点记录
  const dataPoints: SpeedDataPoint[] = [];
  
  // 下载URL
  const downloadUrl = `${SPEED_TEST_SERVER.baseUrl}${SPEED_TEST_SERVER.endpoints.download}`;
  
  // 测试配置
  const MIN_TEST_DURATION_MS = 8000;  // 最小测试时间：8秒
  const MAX_TEST_DURATION_MS = 15000; // 最大测试时间：15秒 (修改为15秒)
  const MIN_DATA_POINTS = 5;          // 最小数据点数量
  const INTERVAL_CHECK_MS = 200;      // 速度检查间隔：200毫秒
  const CONNECTION_TIMEOUT_MS = 5000; // 连接超时时间：5秒
  const MAX_RETRIES = 3;              // 最大重试次数：3次
  const RETRY_DELAY_MS = 1000;        // 重试延迟：1秒
  const CONCURRENT_CONNECTIONS = 2;   // 并发连接数：2个
  
  // 设置一个可用于整个测试的状态对象
  const testState = {
    testStartTime: 0,                // 测试开始时间
    testFinished: false,             // 测试是否完成
    totalBytesDownloaded: 0,         // 总下载字节数
    speedSamples: [] as number[],    // 速度样本集合
    lastProgressUpdate: 0,           // 上次进度更新时间
    activeConnections: 0,            // 当前活动连接数量
    initialSpeed: 0,                 // 初始速度（用于文件大小选择）
    selectedFileSize: '',            // 选定的文件大小
  };
  
  // 报告进度的函数
  const reportProgress = (
    progressPercent: number, 
    currentSpeed?: number
  ) => {
    if (currentSpeed && currentSpeed > 0) {
      // 检查是否应该记录新的数据点
      const now = performance.now();
      const timeSinceLastUpdate = now - testState.lastProgressUpdate;
      
      if (timeSinceLastUpdate >= INTERVAL_CHECK_MS) {
        const lastPoint = dataPoints[dataPoints.length - 1];
        
        // 只在有意义的变化或一定时间间隔后添加数据点
        if (!lastPoint || 
            Math.abs(lastPoint.speed - currentSpeed) > 0.5 || 
            timeSinceLastUpdate >= 1000) {
          dataPoints.push({
            timestamp: Date.now(),
            speed: currentSpeed
          });
          testState.speedSamples.push(currentSpeed);
          testState.lastProgressUpdate = now;
        }
      }
    }
    
    // 发送进度更新
    onProgress('download', progressPercent, currentSpeed, dataPoints);
  };
  
  // 步骤1: 预热连接
  onProgress('download', 0, 0, []);
  try {
    await fetch(`${downloadUrl}?size=xs&cb=${Date.now()}`, { 
      method: 'HEAD',
      cache: 'no-store'
    });
  } catch (error) {
    console.error('预热连接失败:', error);
    // 即使预热失败也继续，不影响主要测试
  }
  
  // 步骤2: 初始测试 - 确定适合的文件大小
  onProgress('download', 5, undefined, dataPoints);
  try {
    const cacheBuster = Date.now();
    const startTime = performance.now();
    const response = await fetch(`${downloadUrl}?size=${TEST_SIZES.S}&cb=${cacheBuster}`, { 
      cache: 'no-store'
    });
    
    // 检查响应状态
    if (!response.ok) {
      throw new Error(`初始测速请求失败，状态码: ${response.status}`);
    }
    
    const blob = await response.blob();
    const endTime = performance.now();
    
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    const fileSize = contentLength || blob.size;
    
    const durationInSeconds = (endTime - startTime) / 1000;
    const bitsLoaded = fileSize * 8;
    const speedBps = (bitsLoaded / durationInSeconds);
    const speedMbps = speedBps / (1024 * 1024);
    
    testState.initialSpeed = speedMbps;
    
    // 添加数据点
    dataPoints.push({
      timestamp: Date.now(),
      speed: speedMbps
    });
    
    onProgress('download', 10, speedMbps, dataPoints);
  } catch (error) {
    console.error('初始速度测试失败:', error);
    testState.initialSpeed = 1; // 失败时使用保守值
    onProgress('download', 10, testState.initialSpeed, dataPoints);
  }
  
  // 步骤3: 根据初始速度选择最适合的文件大小
  if (import.meta.env.MODE === 'development' && 
      throttleSettings.enabled && 
      throttleSettings.fileSize) {
    // 如果在开发环境中且启用了限速，使用指定的文件大小
    testState.selectedFileSize = throttleSettings.fileSize;
    console.log(`[限速测试] 使用固定文件大小: ${testState.selectedFileSize}`);
  } else {
    // 根据初始速度动态选择文件大小
    if (testState.initialSpeed < 5) {
      testState.selectedFileSize = TEST_SIZES.XS; // 低速连接
    } else if (testState.initialSpeed < 20) {
      testState.selectedFileSize = TEST_SIZES.S;  // 中速连接
    } else if (testState.initialSpeed < 50) {
      testState.selectedFileSize = TEST_SIZES.M;  // 高速连接
    } else if (testState.initialSpeed < 200) {
      testState.selectedFileSize = TEST_SIZES.L;  // 非常快的连接
    } else {
      testState.selectedFileSize = TEST_SIZES.XL; // 超高速连接
    }
  }
  
  console.log(`根据初始速度 ${testState.initialSpeed.toFixed(2)} Mbps 选择持续测试文件大小: ${testState.selectedFileSize}`);
  
  // 步骤4: 开始持续测试
  testState.testStartTime = performance.now();
  testState.lastProgressUpdate = testState.testStartTime;
  
  // 创建测试结束的Promise
  const testEndPromise = new Promise<void>((resolve) => {
    // 检查测试是否应该结束的定时器
    const checkInterval = setInterval(() => {
      if (testState.testFinished) {
        clearInterval(checkInterval);
        clearInterval(progressInterval);
        resolve();
        return;
      }
      
      const elapsedMs = performance.now() - testState.testStartTime;
      
      // 检查是否达到测试结束条件
      if (elapsedMs >= MIN_TEST_DURATION_MS && 
          (dataPoints.length >= MIN_DATA_POINTS || 
           testState.totalBytesDownloaded > 5 * 1024 * 1024)) {
        // 达到最小测试时间且有足够数据
        console.log(`达到测试结束条件: 已测试${(elapsedMs/1000).toFixed(1)}秒, 收集${dataPoints.length}个数据点, 下载${(testState.totalBytesDownloaded/(1024*1024)).toFixed(2)}MB`);
        testState.testFinished = true;
        clearInterval(checkInterval);
        clearInterval(progressInterval);
        
        // 确保进度显示为95%并更新速度
        const currentSpeed = calculateCurrentSpeed(elapsedMs);
        reportProgress(95, currentSpeed);
        resolve();
      } 
      // 超时保护，避免测试无限进行
      else if (elapsedMs >= MAX_TEST_DURATION_MS * 1.2) {
        console.warn('下载测试超时，强制结束');
        testState.testFinished = true;
        clearInterval(checkInterval);
        clearInterval(progressInterval);
        
        // 确保进度显示为95%
        const currentSpeed = calculateCurrentSpeed(elapsedMs);
        reportProgress(95, currentSpeed);
        resolve();
      }
    }, 500);
    
    // 进度更新定时器
    const progressInterval = setInterval(() => {
      if (testState.testFinished) {
        clearInterval(progressInterval);
        return;
      }
      
      const elapsedMs = performance.now() - testState.testStartTime;
      // 线性进度，12秒内从10%到95%
      const progressPercent = Math.min(95, 10 + (elapsedMs / MAX_TEST_DURATION_MS) * 85);
      
      // 计算当前速度
      if (elapsedMs > 0 && testState.totalBytesDownloaded > 0) {
        const currentSpeed = calculateCurrentSpeed(elapsedMs);
        reportProgress(progressPercent, currentSpeed);
      } else {
        // 如果还没有数据，只更新进度
        reportProgress(progressPercent);
      }
      
      // 检查是否达到最大测试时间
      if (elapsedMs >= MAX_TEST_DURATION_MS && !testState.testFinished) {
        console.log('达到最大测试时间，标记测试完成');
        testState.testFinished = true;
      }
    }, INTERVAL_CHECK_MS);
  });
  
  // 计算当前下载速度的辅助函数
  const calculateCurrentSpeed = (elapsedMs: number): number => {
    if (elapsedMs <= 0 || testState.totalBytesDownloaded <= 0) return 0;
    
    // 基本速度计算：总下载字节数 × 8 / 总时间(秒) / 1024² (Mbps)
    let speedMbps = (testState.totalBytesDownloaded * 8) / (elapsedMs / 1000) / (1024 * 1024);
    
    // 应用连接校正因子（如果在限速环境，避免结果翻倍）
    const connectionCorrectionFactor = throttleSettings.enabled ? CONCURRENT_CONNECTIONS : 1;
    speedMbps = speedMbps / connectionCorrectionFactor;
    
    return speedMbps;
  };
  
  // 下载单个文件的函数
  const downloadFile = async (connectionId: number, retryCount = 0): Promise<void> => {
    // 检查测试是否已完成
    if (testState.testFinished) {
      console.log(`连接 #${connectionId} 检测到测试已完成，不再下载`);
      return;
    }
    
    // 标记连接活动
    testState.activeConnections++;
    
    try {
      // 创建超时控制器
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn(`连接 #${connectionId} 下载超时(${CONNECTION_TIMEOUT_MS/1000}秒)，中止请求`);
      }, CONNECTION_TIMEOUT_MS);
      
      // 构建请求URL，添加连接ID和重试标记
      const retryMark = retryCount > 0 ? `&retry=${retryCount}` : '';
      const requestUrl = `${downloadUrl}?size=${testState.selectedFileSize}&cid=${connectionId}${retryMark}&cb=${Date.now()}`;
      
      console.log(`连接 #${connectionId} 开始下载${retryCount > 0 ? ` (重试 ${retryCount}/${MAX_RETRIES})` : ''}`);
      
      // 发送请求（考虑限速设置）
      let response;
      if (import.meta.env.MODE === 'development' && 
          throttleSettings.enabled && 
          throttleSettings.throttleKBps > 0) {
        // 应用限速
        const throttleKBps = throttleSettings.throttleKBps;
        const throttledUrl = `${requestUrl}&throttle=${throttleKBps}`;
        response = await fetch(throttledUrl, { signal: controller.signal });
      } else {
        // 无限速
        response = await fetch(requestUrl, { signal: controller.signal });
      }
      
      // 清除超时
      clearTimeout(timeoutId);
      
      // 检查响应状态
      if (!response.ok) {
        throw new Error(`下载请求失败，状态码: ${response.status}`);
      }
      
      // 获取响应流
      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法获取响应流');
      
      // 读取数据流
      let done = false;
      while (!done) {
        // 检查测试是否已完成
        if (testState.testFinished) {
          console.log(`连接 #${connectionId} 检测到测试已完成，停止读取`);
          reader.releaseLock();
          break;
        }
        
        // 读取数据块
        const result = await reader.read();
        done = result.done;
        
        // 如果有数据，累计下载的字节数
        if (!done && result.value) {
          testState.totalBytesDownloaded += result.value.length;
        }
      }
      
      // 确保释放reader
      if (!done) {
        reader.releaseLock();
      }
      
      // 如果测试未完成，继续下载
      if (!testState.testFinished) {
        const elapsedMs = performance.now() - testState.testStartTime;
        console.log(`连接 #${connectionId} 下载完成，测试时间: ${(elapsedMs/1000).toFixed(1)}秒`);
        
        // 短暂延迟后创建新的下载
        await new Promise(resolve => setTimeout(resolve, 100));
        testState.activeConnections--;
        downloadFile(connectionId);
      } else {
        testState.activeConnections--;
      }
    } catch (error) {
      // 处理错误
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`连接 #${connectionId} 下载失败: ${errorMessage}`);
      
      // 检查是否应该重试
      if (retryCount < MAX_RETRIES && !testState.testFinished) {
        console.log(`连接 #${connectionId} 将在${RETRY_DELAY_MS/1000}秒后进行第${retryCount+1}/${MAX_RETRIES}次重试`);
        
        // 延迟后重试
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        testState.activeConnections--;
        
        if (!testState.testFinished) {
          downloadFile(connectionId, retryCount + 1);
        }
      } else {
        // 重试次数用尽或测试已完成
        testState.activeConnections--;
        
        if (!testState.testFinished) {
          console.warn(`连接 #${connectionId} 重试次数已用尽，启动新连接`);
          // 启动新连接而不是重试
          downloadFile(Math.floor(Math.random() * 10000));
        } else {
          console.log(`连接 #${connectionId} 失败后检测到测试已完成，不再重试`);
        }
      }
    }
  };
  
  // 启动并发下载连接
  console.log(`启动${CONCURRENT_CONNECTIONS}个并发下载连接`);
  for (let i = 0; i < CONCURRENT_CONNECTIONS; i++) {
    downloadFile(i + 1);
  }
  
  // 等待测试结束
  await testEndPromise;
  
  // 主动结束测试
  testState.testFinished = true;
  
  // 分析数据，计算最终速度
  const testDurationSec = (performance.now() - testState.testStartTime) / 1000;
  const connectionCorrectionFactor = throttleSettings.enabled ? CONCURRENT_CONNECTIONS : 1;
  const rawSpeed = (testState.totalBytesDownloaded * 8) / testDurationSec / (1024 * 1024);
  const correctedSpeed = rawSpeed / connectionCorrectionFactor;
  
  console.log(`测速完成，总测试时间: ${testDurationSec.toFixed(2)}秒, 总下载: ${(testState.totalBytesDownloaded / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`原始速率: ${rawSpeed.toFixed(2)} Mbps, 连接数: ${CONCURRENT_CONNECTIONS}, 校正因子: ${connectionCorrectionFactor}, 校正后速率: ${correctedSpeed.toFixed(2)} Mbps`);
  
  // 使用多种统计方法计算速度
  let finalSpeed: number | null = null;
  
  if (testState.speedSamples.length > 0) {
    // 方法1: 从总字节数和总时间计算
    const overallSpeedMbps = correctedSpeed;
    
    // 方法2: 稳定区间内的平均速度（排除启动和结束阶段）
    let stableSpeedSamples = testState.speedSamples.map(speed => speed / connectionCorrectionFactor);
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
    
    console.log(`校正后整体速度: ${overallSpeedMbps.toFixed(2)} Mbps, 校正后稳定区间平均: ${avgStableSpeed.toFixed(2)} Mbps, 校正后P75: ${p75Speed?.toFixed(2)} Mbps (由${testState.speedSamples.length}个样本计算)`);
    
    // 最终使用稳定区间内的平均速度作为结果
    finalSpeed = Number(avgStableSpeed.toFixed(2));
  }
  
  // 最终进度报告
  onProgress('download', 100, finalSpeed || 0, dataPoints);
  
  return { speed: finalSpeed, dataPoints };
}; 