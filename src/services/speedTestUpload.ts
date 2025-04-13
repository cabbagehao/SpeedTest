// 上传速度测试模块

import { fetchWithThrottle, SPEED_TEST_SERVER } from './speedTestConfig';
import { SpeedTestProgressCallback, SpeedDataPoint } from './speedTestTypes';
import { createRandomBlob } from './speedTestUtils';

/**
 * 测试上传速度 - 改进版本，持续测试8-11秒
 */
export const testUploadSpeed = async (
  onProgress: SpeedTestProgressCallback
): Promise<{ speed: number | null; dataPoints: SpeedDataPoint[] }> => {
  const dataPoints: SpeedDataPoint[] = [];
  
  onProgress('upload', 0, 0, []);
  
  // 测试上传端点
  const uploadUrl = `${SPEED_TEST_SERVER.baseUrl}${SPEED_TEST_SERVER.endpoints.upload}`;
  
  // 初始化测试配置
  const MIN_TEST_DURATION_MS = 8000; // 最小测试时间：8秒
  const MAX_TEST_DURATION_MS = 11000; // 最大测试时间：11秒（最小+3秒）
  const MIN_DATA_POINTS = 5; // 最小数据点数量
  const INTERVAL_CHECK_MS = 100; // 速度检查间隔：0.1秒
  const CONNECTION_TIMEOUT_MS = 2000; // 连接超时时间：2秒
  const RETRY_DELAY_MS = 1000; // 重试延迟：1秒
  
  // 第一阶段：初步测试，确定网络速度等级
  onProgress('upload', 5, undefined, dataPoints);
  let initialSpeed = 0;
  try {
    // 小文件测试
    const blob = createRandomBlob(256 * 1024); // 256KB
    const formData = new FormData();
    formData.append('file', blob, 'speedtest.bin');
    
    // 添加超时保护
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT_MS); // 使用2秒超时
    
    const startTime = performance.now();
    const response = await fetchWithThrottle(uploadUrl, {
      method: 'POST',
      body: formData,
      cache: 'no-store',
      signal: controller.signal
    }).catch(err => {
      console.error('初始上传请求失败:', err);
      return null;
    });
    
    clearTimeout(timeoutId);
    const endTime = performance.now();
    
    if (response && response.ok) {
      const durationInSeconds = (endTime - startTime) / 1000;
      const bitsUploaded = blob.size * 8;
      const speedBps = (bitsUploaded / durationInSeconds);
      const speedMbps = speedBps / (1024 * 1024);
      
      initialSpeed = speedMbps;
      
      // 添加数据点
      dataPoints.push({
        timestamp: Date.now(),
        speed: speedMbps
      });
      
      onProgress('upload', 10, speedMbps, dataPoints);
    } else {
      // 初始测试失败，使用保守估计
      console.warn('初始上传测试失败，使用保守估计');
      initialSpeed = 1; // 假设1Mbps
      onProgress('upload', 10, initialSpeed, dataPoints);
    }
  } catch (error) {
    console.error('初始上传速度测试失败:', error);
    // 失败时仍继续，使用保守值
    initialSpeed = 1;
    onProgress('upload', 10, initialSpeed, dataPoints);
  }
  
  // 根据初始速度选择合适的块大小（降低一级，更保守）
  let chunkSize = 128 * 1024; // 默认128KB（更保守）
  
  if (initialSpeed > 5) {
    chunkSize = 256 * 1024; // 中速连接：256KB
  }
  
  if (initialSpeed > 20) {
    chunkSize = 512 * 1024; // 高速连接：512KB
  }
  
  if (initialSpeed > 50) {
    chunkSize = 1024 * 1024; // 超高速连接：1MB
  }
  
  console.log(`根据初始速度 ${initialSpeed.toFixed(2)} Mbps 选择上传块大小: ${(chunkSize / 1024 / 1024).toFixed(2)} MB`);
  
  // 持续测试 - 单线程上传
  const testStartTime = performance.now();
  const speedSamples: number[] = [];
  
  // 单线程上传
  const CONCURRENT_CONNECTIONS = 1; // 使用单线程上传
  let totalBytesUploaded = 0;
  let lastProgressUpdate = testStartTime;
  let testFinished = false;
  
  // 在测试过程中定期更新进度
  const updateInterval = setInterval(() => {
    const elapsedMs = performance.now() - testStartTime;
    const progressPercent = Math.min(95, 10 + (elapsedMs / MAX_TEST_DURATION_MS) * 85);
    
    // 计算当前速度
    if (elapsedMs > 0 && totalBytesUploaded > 0) {
      const currentSpeedMbps = (totalBytesUploaded * 8) / (elapsedMs / 1000) / (1024 * 1024);
      
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
      
      onProgress('upload', progressPercent, currentSpeedMbps, dataPoints);
    } else {
      // 如果没有数据上传，也要更新进度
      onProgress('upload', progressPercent, undefined, dataPoints);
    }
    
    // 检查是否达到最大测试时间
    if (elapsedMs >= MAX_TEST_DURATION_MS && !testFinished) {
      console.log('达到最大测试时间，结束上传测试');
      testFinished = true;
      clearInterval(updateInterval);
    }
    
    // 检查是否长时间无数据
    if (elapsedMs > 5000 && totalBytesUploaded === 0 && !testFinished) {
      console.warn('上传测试可能卡住了，没有数据被上传');
    }
  }, INTERVAL_CHECK_MS);
  
  // 创建一个上传任务
  const createUploadTask = async (): Promise<void> => {
    // 检测测试是否已结束
    if (testFinished) {
      return;
    }
    
    let retryCount = 0;
    
    const tryUpload = async (): Promise<boolean> => {
      try {
        // 创建随机数据块
        const blob = createRandomBlob(chunkSize);
        const formData = new FormData();
        formData.append('file', blob, `speedtest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.bin`);
        
        // 创建超时控制器
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT_MS); // 使用2秒超时
        
        const connectionId = Math.floor(Math.random() * 1000);
        console.log(`开始上传连接 #${connectionId}${retryCount > 0 ? ` (重试 ${retryCount})` : ''}`);
        
        // 添加重试标识到URL
        const retryMark = retryCount > 0 ? `&retry=${retryCount}` : '';
        const response = await fetch(`${uploadUrl}${uploadUrl.includes('?') ? '&' : '?'}cb=${Date.now()}&conn=${connectionId}${retryMark}`, {
          method: 'POST',
          body: formData,
          cache: 'no-store',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          // 累计上传的字节数
          totalBytesUploaded += chunkSize;
          return true;
        } else {
          console.warn(`上传请求返回非成功状态: ${response.status}`);
          throw new Error(`上传请求失败，状态码: ${response.status}`);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.warn('上传请求被中止（超时）');
        } else {
          console.error('上传任务失败:', error);
        }
        return false;
      }
    };
    
    // 尝试上传，如果失败则重试
    let success = await tryUpload();
    
    while (!success && !testFinished) {
      retryCount++;
      console.log(`上传失败，将进行重试...`);
      
      // 短暂等待后重试
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      
      // 如果测试已结束，不再重试
      if (testFinished) break;
      
      success = await tryUpload();
    }
    
    // 如果测试未结束，立即开始下一次上传
    if (!testFinished) {
      // 立即开始下一次上传
      return createUploadTask();
    }
  };
  
  // 简化的测试流程，直接使用单线程上传直到满足测试时间
  const runUploadTest = async (): Promise<void> => {
    console.log(`开始上传测试，预计持续${MIN_TEST_DURATION_MS/1000}-${MAX_TEST_DURATION_MS/1000}秒`);
    
    // 启动单线程上传
    await createUploadTask();
  };
  
  // 启动测试并等待完成
  try {
    // 使用Promise.race添加整体超时保护
    await Promise.race([
      runUploadTest(),
      new Promise<void>(resolve => {
        // 当达到最小测试时间且有足够数据时结束测试
        const checkEndCondition = setInterval(() => {
          const elapsedMs = performance.now() - testStartTime;
          if (elapsedMs >= MIN_TEST_DURATION_MS && 
              (dataPoints.length >= MIN_DATA_POINTS || totalBytesUploaded > 0)) {
            console.log('达到最小测试条件，结束上传测试');
            clearInterval(checkEndCondition);
            testFinished = true;
            resolve();
          } else if (elapsedMs >= MAX_TEST_DURATION_MS) {
            console.log('达到最大测试时间，强制结束上传测试');
            clearInterval(checkEndCondition);
            testFinished = true;
            resolve();
          }
        }, 500);
      })
    ]);
  } catch (error) {
    console.error('上传测试出现未捕获错误:', error);
  } finally {
    // 清理资源
    clearInterval(updateInterval);
    testFinished = true;
  }
  
  // 分析数据，计算最终速度
  const testDurationSec = (performance.now() - testStartTime) / 1000;
  console.log(`上传测速完成，总测试时间: ${testDurationSec.toFixed(2)}秒, 总上传: ${(totalBytesUploaded / (1024 * 1024)).toFixed(2)} MB`);
  
  // 使用多种统计方法计算速度
  let finalSpeed: number | null = null;
  
  if (totalBytesUploaded === 0) {
    console.error('上传测试失败：没有成功上传任何数据');
    return { speed: null, dataPoints: [] };
  }
  
  if (speedSamples.length > 0) {
    // 方法1: 从总字节数和总时间计算
    const overallSpeedMbps = (totalBytesUploaded * 8) / testDurationSec / (1024 * 1024);
    
    // 方法2: 稳定区间内的平均速度（排除启动和结束阶段）
    let stableSpeedSamples = speedSamples;
    if (speedSamples.length >= 8) {
      // 排序后去除最低的20%和最高的10%的样本（上传容易受干扰，低端异常通常更多）
      stableSpeedSamples = [...speedSamples].sort((a, b) => a - b);
      const lowCutoff = Math.floor(stableSpeedSamples.length * 0.2);
      const highCutoff = Math.floor(stableSpeedSamples.length * 0.9);
      stableSpeedSamples = stableSpeedSamples.slice(lowCutoff, highCutoff);
    }
    
    const avgStableSpeed = stableSpeedSamples.length > 0 ? 
      stableSpeedSamples.reduce((sum, speed) => sum + speed, 0) / stableSpeedSamples.length : 
      overallSpeedMbps;
    
    // 方法3: 计算第60百分位速度（上传通常取略低于平均值的速度更准确）
    let p60Speed = overallSpeedMbps;
    if (speedSamples.length >= 3) {
      const p60SpeedIndex = Math.floor(speedSamples.length * 0.6);
      p60Speed = [...speedSamples].sort((a, b) => a - b)[p60SpeedIndex];
    }
    
    console.log(`整体上传速度: ${overallSpeedMbps.toFixed(2)} Mbps, 稳定区间平均: ${avgStableSpeed.toFixed(2)} Mbps, P60: ${p60Speed?.toFixed(2)} Mbps`);
    
    // 最终速度取稳定区间平均值和整体速度的加权平均，更保守一些
    finalSpeed = Number(((avgStableSpeed * 0.7 + overallSpeedMbps * 0.3)).toFixed(2));
  } else if (totalBytesUploaded > 0) {
    // 如果有数据但没有样本点，直接用总量计算
    finalSpeed = Number(((totalBytesUploaded * 8) / testDurationSec / (1024 * 1024)).toFixed(2));
  }
  
  onProgress('upload', 100, finalSpeed || 0, dataPoints);
  
  return { 
    speed: finalSpeed, 
    dataPoints: dataPoints.length > 0 ? dataPoints : [
      { timestamp: Date.now() - 1000, speed: finalSpeed || 0 },
      { timestamp: Date.now(), speed: finalSpeed || 0 }
    ] 
  };
}; 