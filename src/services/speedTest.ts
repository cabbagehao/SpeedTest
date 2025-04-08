// 网速测试服务

// 调试模式 - 设置为true可以查看更详细的日志
const DEBUG_MODE = true;

// 测速服务器配置
const SPEED_TEST_SERVER = {
  baseUrl: 'http://localhost:3001/api',
  wsUrl: 'ws://localhost:3001',
  endpoints: {
    info: '/server-info',
    ping: '/ping',
    download: '/download',
    upload: '/upload',
    uploadChunk: '/upload-chunk',
    packetLoss: '/packetloss'
  }
};

// 测试文件大小（字节）
const TEST_SIZES = {
  XS: 'xs', // 256KB
  S: 's',   // 1MB
  M: 'm',   // 5MB
  L: 'l',   // 10MB
  XL: 'xl'  // 100MB
};

// 测速进度回调类型
export type SpeedTestProgressCallback = (stage: string, progress: number, currentSpeed?: number, dataPoints?: SpeedDataPoint[]) => void;

// 速度数据点
export interface SpeedDataPoint {
  timestamp: number;
  speed: number; // Mbps
}

// 测速结果
export interface SpeedTestResult {
  downloadSpeed: number | null;
  uploadSpeed: number | null;
  ping: number | null;
  jitter: number | null;
  packetLoss: number | null;
  testServer: string;
  timestamp: number;
  downloadDataPoints: SpeedDataPoint[];
  uploadDataPoints: SpeedDataPoint[];
}

// 全局WebSocket连接
let wsConnection: WebSocket | null = null;
let pingIntervalId: number | null = null;
let packetLossTestIntervalId: number | null = null;

/**
 * 初始化WebSocket连接
 */
export const initWebSocketConnection = (): Promise<WebSocket> => {
  return new Promise((resolve, reject) => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      resolve(wsConnection);
      return;
    }

    wsConnection = new WebSocket(SPEED_TEST_SERVER.wsUrl);

    wsConnection.onopen = () => {
      console.log('WebSocket连接已建立');
      resolve(wsConnection!);
    };

    wsConnection.onerror = (error) => {
      console.error('WebSocket连接错误:', error);
      wsConnection = null;
      reject(error);
    };

    wsConnection.onclose = () => {
      console.log('WebSocket连接已关闭');
      wsConnection = null;
    };
  });
};

/**
 * 关闭WebSocket连接
 */
export const closeWebSocketConnection = () => {
  if (wsConnection) {
    wsConnection.close();
    wsConnection = null;
  }

  if (pingIntervalId) {
    clearInterval(pingIntervalId);
    pingIntervalId = null;
  }

  if (packetLossTestIntervalId) {
    clearInterval(packetLossTestIntervalId);
    packetLossTestIntervalId = null;
  }
};

/**
 * 测量网络延迟（ping）
 */
export const measurePing = async (): Promise<{ ping: number; jitter: number }> => {
  const pings: number[] = [];
  const pingUrl = `${SPEED_TEST_SERVER.baseUrl}${SPEED_TEST_SERVER.endpoints.ping}`;
  
  // 执行5次ping测试
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    try {
      const response = await fetchWithThrottle(`${pingUrl}?cb=${Date.now()}`, { 
        method: 'GET',
        cache: 'no-store'
      });
      const end = performance.now();
      const data = await response.json();
      
      // 减去服务器处理时间得到更准确的网络延迟
      const networkTime = (end - start) - (data.serverProcessingTime || 0);
      pings.push(networkTime);
    } catch (error) {
      console.error('Ping测试失败:', error);
    }
    // 等待一小段时间后再进行下一次测试
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // 排除最高和最低值，计算平均ping值
  if (pings.length >= 3) {
    pings.sort((a, b) => a - b);
    const validPings = pings.slice(1, -1);
    const avgPing = validPings.reduce((sum, ping) => sum + ping, 0) / validPings.length;
    
    // 计算抖动（ping值的标准差）
    const pingVariance = validPings.reduce((sum, ping) => sum + Math.pow(ping - avgPing, 2), 0) / validPings.length;
    const jitter = Math.sqrt(pingVariance);
    
    return { ping: Math.round(avgPing), jitter: Math.round(jitter) };
  }
  
  return { ping: 0, jitter: 0 };
};

/**
 * 测试丢包率
 */
export const measurePacketLoss = async (): Promise<number> => {
  const packetLossUrl = `${SPEED_TEST_SERVER.baseUrl}${SPEED_TEST_SERVER.endpoints.packetLoss}`;
  
  const totalPackets = 50;
  let receivedPackets = 0;
  const timeoutMs = 2000; // 2秒超时
  
  // 发送多个数据包并计算收到的比例
  for (let i = 0; i < totalPackets; i++) {
    try {
      const id = Date.now() + '-' + i;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetchWithThrottle(`${packetLossUrl}?id=${id}&cb=${Date.now()}`, { 
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      }).catch(() => null);
      
      clearTimeout(timeoutId);
      
      if (response && response.ok) {
        receivedPackets++;
      }
    } catch (error) {
      // 超时或请求失败视为丢包
      console.log(`数据包 ${i} 丢失或超时`);
    }
    
    // 短暂间隔避免网络拥塞
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  // 计算丢包率（百分比）
  const packetLossRate = ((totalPackets - receivedPackets) / totalPackets) * 100;
  return Number(packetLossRate.toFixed(1));
};

/**
 * 确定最佳测试文件大小
 * 根据初步速度测试动态确定
 */
const determineBestFileSize = async (
  initialSpeedMbps: number
): Promise<string> => {
  if (initialSpeedMbps < 5) {
    return TEST_SIZES.XS; // 低速连接用小文件
  } else if (initialSpeedMbps < 20) {
    return TEST_SIZES.S;  // 中速连接
  } else if (initialSpeedMbps < 50) {
    return TEST_SIZES.M;  // 高速连接
  } else if (initialSpeedMbps < 200) {
    return TEST_SIZES.L;  // 非常快的连接
  } else {
    return TEST_SIZES.XL; // 超高速连接
  }
};

// 导入全局限速设置
import { throttleSettings } from '../components/ThrottleTestSettings';

/**
 * 开发模式下的限速测试
 * 用于测试不同网络环境下的应用表现
 */
export const runThrottleTest = (fileSize: string, throttleKBps: number): string => {
  // 验证文件大小参数
  const validSizes = Object.values(TEST_SIZES);
  const size = validSizes.includes(fileSize as any) ? fileSize : TEST_SIZES.S;
  
  // 构建限速测试URL
  const downloadUrl = `${SPEED_TEST_SERVER.baseUrl}${SPEED_TEST_SERVER.endpoints.download}?size=${size}&throttle=${throttleKBps}&ts=${Date.now()}`;
  
  return downloadUrl;
};

/**
 * 带限速控制的通用下载函数
 */
const fetchWithThrottle = async (url: string, options?: RequestInit): Promise<Response> => {
  // 检查是否应用限速设置
  if (import.meta.env.MODE === 'development' && 
      throttleSettings.enabled && 
      throttleSettings.throttleKBps > 0) {
    
    // 在URL中添加限速参数 (KB/s)
    const throttleKBps = throttleSettings.throttleKBps;
    const separator = url.includes('?') ? '&' : '?';
    
    // 向服务器传递KB/s值，服务器端会进行bit/s换算
    const throttledUrl = `${url}${separator}throttle=${throttleKBps}`;
    
    if (DEBUG_MODE) {
      console.log(`[限速测试] 应用限速: ${throttleKBps} KB/s (${(throttleKBps * 8 / 1024).toFixed(2)} Mbps), URL: ${url.substring(0, 100)}...`);
    } else {
      console.log(`[限速测试] 应用限速: ${throttleKBps} KB/s (${(throttleKBps * 8 / 1024).toFixed(2)} Mbps)`);
    }
    
    return fetch(throttledUrl, options);
  } else {
    // 无限速
    return fetch(url, options);
  }
};

/**
 * 测试下载速度 - 改进版本，持续测试15-30秒
 */
export const testDownloadSpeed = async (
  onProgress: SpeedTestProgressCallback
): Promise<{ speed: number | null; dataPoints: SpeedDataPoint[] }> => {
  // 数据点记录
  const dataPoints: SpeedDataPoint[] = [];
  
  // 下载URL
  const downloadUrl = `${SPEED_TEST_SERVER.baseUrl}${SPEED_TEST_SERVER.endpoints.download}`;
  
  // 初始化测试配置
  const MIN_TEST_DURATION_MS = 15000; // 最小测试时间：15秒
  const MAX_TEST_DURATION_MS = 30000; // 最大测试时间：30秒
  const MIN_DATA_POINTS = 5; // 最小数据点数量，从10改为5更合理
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
  const CONCURRENT_CONNECTIONS = 2; // 使用2个并发连接，适中的并发度
  let totalBytesDownloaded = 0;
  let lastProgressUpdate = testStartTime;
  let testFinished = false;
  
  // 在测试过程中每200ms更新一次进度
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
  
  // 创建一个下载任务 - 下载单个大文件而不是多个小文件
  const createDownloadTask = async (): Promise<void> => {
    try {
      const cacheBuster = Date.now() + '-' + Math.random();
      // 大文件下载，这里用XL确保文件足够大不会中途下载完
      // 给每个连接添加标识符，便于调试
      const connectionId = Math.floor(Math.random() * 1000);
      console.log(`开始下载连接 #${connectionId}`);
      
      const response = await fetchWithThrottle(`${downloadUrl}?size=${TEST_SIZES.XL}&cb=${cacheBuster}&conn=${connectionId}`, { 
        cache: 'no-store'
      });
      
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
            return createDownloadTask();
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
      console.error('下载任务失败:', error);
      
      // 如果下载失败但测试时间不足，尝试重新开始新的下载
      const elapsedMs = performance.now() - testStartTime;
      if (elapsedMs < MIN_TEST_DURATION_MS && !testFinished) {
        console.log('下载任务失败，但测试时间不足，尝试重新下载...');
        // 短暂延迟后重试
        await new Promise(resolve => setTimeout(resolve, 500));
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
        console.log(`达到测试结束条件: 已测试${(elapsedMs/1000).toFixed(1)}秒, 收集${dataPoints.length}个数据点, 下载${(totalBytesDownloaded/(1024*1024)).toFixed(2)}MB`);
        testFinished = true;
        clearInterval(checkInterval);
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

/**
 * 创建指定大小的随机数据Blob
 * 优化版本，提高大文件生成性能
 */
const createRandomBlob = (size: number): Blob => {
  // 对于大文件，使用分块创建方式以避免内存问题
  const CHUNK_SIZE = 1024 * 1024; // 1MB块
  
  if (size <= CHUNK_SIZE) {
    // 小文件直接创建
    const buffer = new Uint8Array(size);
    
    // 填充随机数据（只填充部分字节以提高性能）
    const randomBytes = crypto.getRandomValues(new Uint8Array(Math.min(1024, size)));
    for (let i = 0; i < size; i += randomBytes.length) {
      buffer.set(randomBytes, i % (size - randomBytes.length));
    }
    
    return new Blob([buffer]);
  } else {
    // 大文件分块创建
    const chunks: Uint8Array[] = [];
    const template = new Uint8Array(CHUNK_SIZE);
    
    // 创建随机模板数据
    crypto.getRandomValues(template.subarray(0, 1024));
    // 复制模板数据到剩余部分
    for (let i = 1024; i < CHUNK_SIZE; i += 1024) {
      template.set(template.subarray(0, Math.min(1024, CHUNK_SIZE - i)), i);
    }
    
    // 创建完整数据块
    const fullChunks = Math.floor(size / CHUNK_SIZE);
    const remainder = size % CHUNK_SIZE;
    
    // 添加完整块
    for (let i = 0; i < fullChunks; i++) {
      chunks.push(new Uint8Array(template));
    }
    
    // 添加剩余部分
    if (remainder > 0) {
      chunks.push(template.slice(0, remainder));
    }
    
    return new Blob(chunks);
  }
};

/**
 * 测试上传速度 - 改进版本，持续测试15-30秒
 */
export const testUploadSpeed = async (
  onProgress: SpeedTestProgressCallback
): Promise<{ speed: number | null; dataPoints: SpeedDataPoint[] }> => {
  const dataPoints: SpeedDataPoint[] = [];
  
  onProgress('upload', 0, 0, []);
  
  // 测试上传端点
  const uploadUrl = `${SPEED_TEST_SERVER.baseUrl}${SPEED_TEST_SERVER.endpoints.upload}`;
  
  // 初始化测试配置
  const MIN_TEST_DURATION_MS = 15000; // 最小测试时间：15秒
  const MAX_TEST_DURATION_MS = 30000; // 最大测试时间：30秒
  const MAX_TOTAL_TEST_DURATION_MS = 45000; // 绝对最大测试时间：45秒（防止卡死）
  const MIN_DATA_POINTS = 5; // 最小数据点数量
  const INTERVAL_CHECK_MS = 250; // 速度检查间隔：250毫秒
  
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
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
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
  
  // 持续测试 - 固定连接数持续上传
  const testStartTime = performance.now();
  const speedSamples: number[] = [];
  
  // 并发连接数（比之前更少，减少堵塞风险）
  const CONCURRENT_CONNECTIONS = 1; // 改为单连接，避免服务器压力过大
  let totalBytesUploaded = 0;
  let lastProgressUpdate = testStartTime;
  let testFinished = false;
  
  // 添加硬性超时保护
  const hardTimeoutId = setTimeout(() => {
    if (!testFinished) {
      console.warn('上传测试触发硬性超时保护，强制结束测试');
      testFinished = true;
    }
  }, MAX_TOTAL_TEST_DURATION_MS);
  
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
      testFinished = true;
      clearInterval(updateInterval);
    }
    
    // 长时间没有数据上传，可能卡住了
    if (elapsedMs > 8000 && totalBytesUploaded === 0 && !testFinished) {
      console.warn('上传测试可能卡住了，没有数据被上传');
      // 不立即终止，再给一点时间
    }
    
    // 如果超过20秒还没有任何数据上传，直接终止测试
    if (elapsedMs > 20000 && totalBytesUploaded === 0 && !testFinished) {
      console.error('上传测试卡住了，强制终止');
      testFinished = true;
      clearInterval(updateInterval);
    }
  }, INTERVAL_CHECK_MS);
  
  // 创建一个简化的上传任务，降低复杂性
  const createUploadTask = async (): Promise<void> => {
    // 检测测试是否已结束
    if (testFinished) {
      return;
    }
    
    try {
      // 创建随机数据块，使用更小的块减少失败风险
      const blob = createRandomBlob(chunkSize);
      const formData = new FormData();
      formData.append('file', blob, `speedtest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.bin`);
      
      // 创建超时控制器
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn('上传请求超时，已中止');
      }, 10000); // 10秒超时，比整体测试短
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        // 累计上传的字节数
        totalBytesUploaded += chunkSize;
      } else {
        console.warn(`上传请求返回非成功状态: ${response.status}`);
      }
    } catch (error) {
      // 更宽容的错误处理
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.warn('上传请求被中止');
      } else {
        console.error('上传任务失败:', error);
      }
      
      // 短暂等待后继续，避免立即重试造成更多问题
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };
  
  // 简化的测试流程，更可靠地控制测试结束
  const runUploadTest = async (): Promise<void> => {
    // 持续上传直到测试结束
    while (!testFinished) {
      // 检查是否到达最大测试时间
      if (performance.now() - testStartTime >= MAX_TEST_DURATION_MS) {
        console.log('达到最大测试时间，结束上传测试');
        testFinished = true;
        break;
      }
      
      // 创建上传承诺，最多同时CONCURRENT_CONNECTIONS个
      const uploadPromises = [];
      for (let i = 0; i < CONCURRENT_CONNECTIONS; i++) {
        uploadPromises.push(createUploadTask());
      }
      
      // 等待所有上传完成
      await Promise.all(uploadPromises);
      
      // 检查是否已经收集到足够的数据点和测试时间
      const elapsedMs = performance.now() - testStartTime;
      if (elapsedMs >= MIN_TEST_DURATION_MS && 
          (dataPoints.length >= MIN_DATA_POINTS || totalBytesUploaded > 0)) {
        console.log('达到最小测试条件，结束上传测试');
        testFinished = true;
        break;
      }
    }
  };
  
  // 启动测试并等待完成（添加超时保护）
  try {
    // 使用Promise.race添加整体超时保护
    await Promise.race([
      runUploadTest(),
      new Promise<void>(resolve => {
        setTimeout(() => {
          if (!testFinished) {
            console.warn('上传测试整体超时');
            testFinished = true;
          }
          resolve();
        }, MAX_TOTAL_TEST_DURATION_MS - 1000); // 比硬性超时早1秒
      })
    ]);
  } catch (error) {
    console.error('上传测试出现未捕获错误:', error);
  } finally {
    // 清理资源
    clearInterval(updateInterval);
    clearTimeout(hardTimeoutId);
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

/**
 * 获取服务器信息
 */
export const getServerInfo = async (): Promise<{ name: string; location: string } | null> => {
  try {
    const infoUrl = `${SPEED_TEST_SERVER.baseUrl}${SPEED_TEST_SERVER.endpoints.info}`;
    const response = await fetchWithThrottle(infoUrl);
    if (response.ok) {
      const data = await response.json();
      return {
        name: data.name,
        location: data.location
      };
    }
    return null;
  } catch (error) {
    console.error('获取服务器信息失败:', error);
    return null;
  }
};

/**
 * 执行完整的网速测试
 */
export const runSpeedTest = async (
  onProgress: SpeedTestProgressCallback
): Promise<SpeedTestResult> => {
  // 0. 获取服务器信息
  let serverInfo: { name: string; location: string } = { 
    name: '高性能测速服务器', 
    location: '未知位置' 
  };
  
  try {
    const info = await getServerInfo();
    if (info) {
      serverInfo = info;
    }
  } catch (error) {
    console.error('无法获取服务器信息:', error);
  }
  
  // 1. 测量ping
  onProgress('ping', 0);
  const { ping, jitter } = await measurePing();
  onProgress('ping', 100);
  
  // 2. 测试丢包率
  onProgress('packetLoss', 0);
  const packetLoss = await measurePacketLoss();
  onProgress('packetLoss', 100);
  
  // 3. 测试下载速度
  const { speed: downloadSpeed, dataPoints: downloadDataPoints } = 
    await testDownloadSpeed(onProgress);
  
  // 4. 测试上传速度
  const { speed: uploadSpeed, dataPoints: uploadDataPoints } = 
    await testUploadSpeed(onProgress);
  
  // 返回完整结果
  return {
    downloadSpeed,
    uploadSpeed,
    ping,
    jitter,
    packetLoss,
    testServer: `${serverInfo.name} (${serverInfo.location})`,
    timestamp: Date.now(),
    downloadDataPoints,
    uploadDataPoints
  };
}; 