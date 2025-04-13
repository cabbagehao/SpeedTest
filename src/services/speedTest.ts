// 网速测试服务

// 调试模式 - 设置为true可以查看更详细的日志
const DEBUG_MODE = true;

// 服务器API基础URL
const API_BASE_URL = 'http://localhost:3001/api';

// 测速服务器配置
const SPEED_TEST_SERVER = {
  baseUrl: API_BASE_URL,
  wsUrl: 'ws://localhost:3001',
  endpoints: {
    info: '/server-info',
    ping: '/ping',
    download: '/download',
    upload: '/upload',
    uploadChunk: '/upload-chunk',
    packetloss: '/packetloss',
    clientInfo: '/client-info',
    saveResult: '/save-result'
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

// 导入测试设置
import { testSettings } from '../services/speedTestConfig';

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
      // 添加3秒超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒超时
      
      const response = await fetch(`${pingUrl}?cb=${Date.now()}`, { 
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
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
  const packetLossUrl = `${SPEED_TEST_SERVER.baseUrl}${SPEED_TEST_SERVER.endpoints.packetloss}`;
  
  const totalPackets = 50;
  let receivedPackets = 0;
  const timeoutMs = 2000; // 2秒超时
  
  // 发送多个数据包并计算收到的比例
  for (let i = 0; i < totalPackets; i++) {
    try {
      const id = Date.now() + '-' + i;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(`${packetLossUrl}?id=${id}&cb=${Date.now()}`, { 
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

/**
 * 测试下载速度 - 改进版本，持续测试用户设定的时间
 */
export const testDownloadSpeed = async (
  onProgress: SpeedTestProgressCallback
): Promise<{ speed: number | null; dataPoints: SpeedDataPoint[] }> => {
  // 数据点记录
  const dataPoints: SpeedDataPoint[] = [];
  
  // 下载URL
  const downloadUrl = `${SPEED_TEST_SERVER.baseUrl}${SPEED_TEST_SERVER.endpoints.download}`;
  
  // 从测试设置获取时间配置
  const MIN_TEST_DURATION_MS = testSettings.downloadTestDuration.min;
  const MAX_TEST_DURATION_MS = testSettings.downloadTestDuration.max; 
  const MIN_DATA_POINTS = 5; // 最小数据点数量，从10改为5更合理
  const INTERVAL_CHECK_MS = 200; // 速度检查间隔：200毫秒
  
  // 预热连接
  onProgress('download', 0, 0, []);
  try {
    await fetch(`${downloadUrl}?size=xs&cb=${Date.now()}`, { 
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
    const response = await fetch(`${downloadUrl}?size=${TEST_SIZES.S}&cb=${cacheBuster}`, { 
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
  
  // 选择适合的文件大小进行持续测试
  let testFileSize = TEST_SIZES.S;
  
  // 根据用户设置或自动确定文件大小
  if (!testSettings.autoFileSize) {
    testFileSize = testSettings.downloadFileSize;
    console.log(`使用手动设置的下载文件大小: ${testFileSize}`);
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
  
  // 并发连接数（使用2个连接提高测试准确性）
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
      // 计算当前速度 
      // 测试速度 = 总下载字节数 × 8 / 总时间(秒) / 1024² (Mbps)
      let currentSpeedMbps = (totalBytesDownloaded * 8) / (elapsedMs / 1000) / (1024 * 1024);
      
      // 应用连接数校正因子
      const connectionCorrectionFactor = CONCURRENT_CONNECTIONS;
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
      // 使用选择的文件大小
      const connectionId = Math.floor(Math.random() * 1000);
      console.log(`开始下载连接 #${connectionId}`);
      
      const response = await fetch(`${downloadUrl}?size=${testFileSize}&cb=${cacheBuster}&conn=${connectionId}`, { 
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
  const connectionCorrectionFactor = CONCURRENT_CONNECTIONS;

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
 * 测试上传速度 - 改进版本，使用用户设定的测试时间
 */
export const testUploadSpeed = async (
  onProgress: SpeedTestProgressCallback
): Promise<{ speed: number | null; dataPoints: SpeedDataPoint[] }> => {
  const dataPoints: SpeedDataPoint[] = [];
  
  onProgress('upload', 0, 0, []);
  
  // 测试上传端点
  const uploadUrl = `${SPEED_TEST_SERVER.baseUrl}${SPEED_TEST_SERVER.endpoints.upload}`;
  
  // 从测试设置获取时间配置
  const MIN_TEST_DURATION_MS = testSettings.uploadTestDuration.min;
  const MAX_TEST_DURATION_MS = testSettings.uploadTestDuration.max;
  const MAX_TOTAL_TEST_DURATION_MS = MAX_TEST_DURATION_MS * 1.5; // 绝对最大测试时间，防止卡死
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
    const response = await fetch(uploadUrl, {
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
  
  // 根据初始速度或用户设置选择合适的块大小
  let chunkSize = 128 * 1024; // 默认128KB（更保守）
  
  if (!testSettings.autoFileSize) {
    // 根据用户设置的文件大小选择上传块大小
    switch (testSettings.uploadFileSize) {
      case TEST_SIZES.XS:
        chunkSize = 128 * 1024; // 128KB
        break;
      case TEST_SIZES.S:
        chunkSize = 256 * 1024; // 256KB
        break;
      case TEST_SIZES.M:
        chunkSize = 512 * 1024; // 512KB
        break;
      case TEST_SIZES.L:
        chunkSize = 1024 * 1024; // 1MB
        break;
      case TEST_SIZES.XL:
        chunkSize = 2048 * 1024; // 2MB
        break;
      default:
        chunkSize = 256 * 1024; // 默认256KB
    }
    console.log(`使用手动设置的上传文件大小: ${testSettings.uploadFileSize}, 块大小: ${(chunkSize / 1024).toFixed(0)}KB`);
  } else {
    // 根据初始速度动态选择块大小
    if (initialSpeed > 5) {
      chunkSize = 256 * 1024; // 中速连接：256KB
    }
    
    if (initialSpeed > 20) {
      chunkSize = 512 * 1024; // 高速连接：512KB
    }
    
    if (initialSpeed > 50) {
      chunkSize = 1024 * 1024; // 超高速连接：1MB
    }
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
export const getServerInfo = async (): Promise<any> => {
  try {
    // 添加3秒超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒超时
    
    const response = await fetch(`${SPEED_TEST_SERVER.baseUrl}${SPEED_TEST_SERVER.endpoints.info}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`服务器响应错误: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('获取服务器信息失败:', error);
    throw error;
  }
};

// 测速历史存储键
const HISTORY_STORAGE_KEY = 'speedtest_history';

/**
 * 执行完整的网速测试
 */
export const runSpeedTest = async (
  onProgress: SpeedTestProgressCallback,
  onStageComplete?: (stageName: string, result: Partial<SpeedTestResult>) => void
): Promise<SpeedTestResult> => {
  // 进度分配 - 总进度为100%，根据测试时间分配
  // 服务器信息: 5%
  // Ping测试: 10% 
  // 丢包率测试: 15%
  // 下载测试: 45% (15秒)
  // 上传测试: 25% (12秒)
  let totalProgress = 0;
  
  // 存储最终结果
  let finalResult: Partial<SpeedTestResult> = {
    timestamp: Date.now()
  };

  // 平滑过渡设置
  const SMOOTH_TRANSITION_INTERVAL = 50; // 更新间隔(ms)
  const SMOOTH_TRANSITION_STEP = 0.5; // 每次更新增加的进度百分比

  // 创建平滑过渡动画
  const smoothTransition = async (fromProgress: number, toProgress: number, stage: string) => {
    let currentProgress = fromProgress;

    while (currentProgress < toProgress) {
      currentProgress = Math.min(currentProgress + SMOOTH_TRANSITION_STEP, toProgress);
      // 使用相同的stage防止进度条颜色变化
      onProgress(stage, Math.round(currentProgress), (finalResult.uploadSpeed || undefined));

      if (currentProgress >= toProgress) break;
      await new Promise(resolve => setTimeout(resolve, SMOOTH_TRANSITION_INTERVAL));
    }
  };

  // 进度更新包装函数
  const updateProgress = async (stage: string, stageProgress: number, currentSpeed?: number, dataPoints?: SpeedDataPoint[]) => {
    let absoluteProgress = 0;

    switch(stage) {
      case 'init':
        absoluteProgress = (stageProgress / 100) * 5;
        break;
      case 'ping':
        absoluteProgress = 5 + (stageProgress / 100) * 10;
        break;
      case 'packetLoss':
        absoluteProgress = 15 + (stageProgress / 100) * 15;
        break;
      case 'download':
        absoluteProgress = 30 + (stageProgress / 100) * 45;
        break;
      case 'upload':
        absoluteProgress = 75 + (stageProgress / 100) * 25;
        break;
      default:
        absoluteProgress = stageProgress;
    }

    // 如果是阶段性的100%进度，先更新到95%，然后平滑过渡
    if (stageProgress === 100 && absoluteProgress > totalProgress + 5) {
      const transitionTo = absoluteProgress - 5;
      if (transitionTo > totalProgress) {
        await smoothTransition(totalProgress, transitionTo, stage);
        totalProgress = transitionTo;
      }
    }

    // 更新总进度
    if (Math.round(absoluteProgress) > totalProgress) {
      totalProgress = Math.round(absoluteProgress);

      // 始终显示当前速度，不管是什么阶段
      onProgress(stage, totalProgress, currentSpeed, dataPoints);
    }
  };

  // 0. 获取服务器信息
  let serverInfo: { name: string; location: string } = {
    name: '高性能测速服务器',
    location: '未知位置'
  };

  updateProgress('init', 0);
  try {
    // 设置获取服务器信息的超时处理
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 3000); // 3秒超时，从5秒修改为3秒
    });

    // 使用Promise.race确保请求不会无限等待
    const info = await Promise.race([
      getServerInfo(),
      timeoutPromise
    ]);

    if (info) {
      serverInfo = info;
    }
  } catch (error) {
    console.error('无法获取服务器信息:', error);
  } finally {
    // 无论是否成功，都更新进度并继续后续测试步骤
    await updateProgress('init', 100);
  }

  // 1. 测量ping
  let pingResult: { ping: number | null; jitter: number | null } = { ping: null, jitter: null };
  try {
    // 添加ping测试的整体超时保护
    const pingTimeoutPromise = new Promise<{ ping: number | null; jitter: number | null }>((resolve) => {
      setTimeout(() => resolve({ ping: null, jitter: null }), 5000); // 5秒整体超时
    });
    
    // 单个ping请求已经有3秒超时，这里是整体超时
    pingResult = await Promise.race([
      measurePing(),
      pingTimeoutPromise
    ]);
  } catch (error) {
    console.error('Ping测试失败:', error);
  }
  finalResult.ping = pingResult.ping;
  finalResult.jitter = pingResult.jitter;
  await updateProgress('ping', 100);

  // 通知ping测试完成
  finalResult.testServer = `${serverInfo.name} (${serverInfo.location})`;
  if (onStageComplete) {
    onStageComplete('ping', {...finalResult});
  }

  // 2. 测试丢包率
  let packetLossResult = null;
  try {
    // 丢包率测试已有单个请求超时机制(2秒)，这里添加整体阶段超时保护
    const packetLossTimeoutPromise = new Promise<number>((resolve) => {
      setTimeout(() => resolve(0), 10000); // 10秒整体超时
    });
    
    packetLossResult = await Promise.race([
      measurePacketLoss(),
      packetLossTimeoutPromise
    ]);
  } catch (error) {
    console.error('丢包率测试失败:', error);
  }
  finalResult.packetLoss = packetLossResult;
  await updateProgress('packetLoss', 100);

  // 通知丢包率测试完成
  if (onStageComplete) {
    onStageComplete('packetLoss', {...finalResult});
  }

  // 3. 测试下载速度
  const progressDownloadCallback = (stage: string, progress: number, speed?: number, dataPoints?: SpeedDataPoint[]) => {  
    updateProgress('download', progress, speed, dataPoints);
    if (progress === 100 && speed !== undefined) {
      finalResult.downloadSpeed = speed;
      finalResult.downloadDataPoints = dataPoints || [];
    }
  };

  let downloadSpeed: number | null = null;
  let downloadDataPoints: SpeedDataPoint[] = [];

  try {
    // 下载测试已有内部超时和重试机制，不需要添加额外的超时
    // 只添加整体超时保护
    const downloadTimeoutPromise = new Promise<{ speed: number | null; dataPoints: SpeedDataPoint[] }>((_, reject) => {
      setTimeout(() => {
        reject(new Error('下载测试超时（3秒）'));
      }, 3000);
    });
    
    const result = await Promise.race([
      testDownloadSpeed(progressDownloadCallback),
      downloadTimeoutPromise
    ]);
    
    downloadSpeed = result.speed;
    downloadDataPoints = result.dataPoints;

    finalResult.downloadSpeed = downloadSpeed;
    finalResult.downloadDataPoints = downloadDataPoints;
  } catch (error) {
    console.error('下载测试失败:', error);
    // 确保即使失败也设置一个默认值
    finalResult.downloadSpeed = null;
    // 确保进度条完成
    updateProgress('download', 100);
  }

  // 通知下载测试完成
  if (onStageComplete) {
    onStageComplete('download', {...finalResult});
  }

  // 下载完成后，平滑过渡到上传阶段
  await smoothTransition(totalProgress, 75, 'download');

  // 4. 测试上传速度
  const progressUploadCallback = (stage: string, progress: number, speed?: number, dataPoints?: SpeedDataPoint[]) => {    
    // 始终传递真实速度值
    updateProgress('upload', progress, speed, dataPoints);
    if (progress === 100 && speed !== undefined) {
      finalResult.uploadSpeed = speed;
      finalResult.uploadDataPoints = dataPoints || [];
    }
  };

  let uploadSpeed: number | null = null;
  let uploadDataPoints: SpeedDataPoint[] = [];

  try {
    // 上传测试已有内部超时和重试机制，不需要添加额外的超时
    // 只添加整体超时保护，避免测试卡住
    const uploadTimeoutPromise = new Promise<{ speed: number | null; dataPoints: SpeedDataPoint[] }>((_, reject) => {
      setTimeout(() => {
        reject(new Error('上传测试超时（3秒）'));
      }, 3000);
    });
    
    const result = await Promise.race([
      testUploadSpeed(progressUploadCallback),
      uploadTimeoutPromise
    ]);
    
    uploadSpeed = result.speed;
    uploadDataPoints = result.dataPoints;

    finalResult.uploadSpeed = uploadSpeed;
    finalResult.uploadDataPoints = uploadDataPoints;
  } catch (error) {
    console.error('上传测试失败:', error);
    // 确保即使失败也设置一个默认值
    finalResult.uploadSpeed = null;
    // 确保进度条完成
    updateProgress('upload', 100);
  }

  // 确保最终进度为100%
  const completeResult: SpeedTestResult = {
    downloadSpeed: finalResult.downloadSpeed ?? null,
    uploadSpeed: finalResult.uploadSpeed ?? null,
    ping: finalResult.ping ?? null,
    jitter: finalResult.jitter ?? null,
    packetLoss: finalResult.packetLoss ?? null,
    testServer: finalResult.testServer || 'Unknown',
    timestamp: finalResult.timestamp || Date.now(),
    downloadDataPoints: finalResult.downloadDataPoints || [],
    uploadDataPoints: finalResult.uploadDataPoints || []
  };

  // 通知上传测试完成
  if (onStageComplete) {
    onStageComplete('upload', completeResult);
  }

  // 5. 保存结果到本地
  saveTestHistory(completeResult);
  
  // 6. 保存结果到服务器
  try {
    // 添加保存结果的超时保护
    const saveTimeoutPromise = new Promise<void>((resolve) => {
      setTimeout(resolve, 5000); // 5秒超时
    });
    
    await Promise.race([
      saveResultToServer(completeResult),
      saveTimeoutPromise
    ]);
  } catch (error) {
    console.error('保存结果到服务器失败:', error);
    // 继续执行，不中断测试流程
  }

  // 最终平滑过渡到100%
  await smoothTransition(totalProgress, 100, 'upload');

  return completeResult;
};

/**
 * 获取客户端IP信息
 */
export const getClientIpInfo = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/client-info`);
    if (!response.ok) {
      throw new Error(`服务器响应错误: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('获取IP信息失败:', error);
    throw error;
  }
};

/**
 * 保存测试结果到服务器
 */
const saveResultToServer = async (result: SpeedTestResult): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/save-result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...result,
        testType: 'basic'
      }),
    });
    
    if (!response.ok) {
      throw new Error(`服务器响应错误: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('保存结果到服务器失败:', error);
    throw error;
  }
};

/**
 * 保存测试结果到本地存储
 */
const saveTestHistory = (result: SpeedTestResult): void => {
  try {
    // 获取现有历史
    const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    let history: SpeedTestResult[] = [];
    
    if (savedHistory) {
      history = JSON.parse(savedHistory);
    }
    
    // 添加新结果
    history.push(result);
    
    // 只保留最近的20条记录
    if (history.length > 20) {
      history = history.slice(-20);
    }
    
    // 保存回本地存储
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('保存测试历史失败:', error);
  }
};

/**
 * 获取测试历史
 */
export const getTestHistory = (): SpeedTestResult[] => {
  try {
    const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    
    if (savedHistory) {
      return JSON.parse(savedHistory);
    }
    
    return [];
  } catch (error) {
    console.error('获取测试历史失败:', error);
    return [];
  }
};

/**
 * 清除测试历史
 */
export const clearTestHistory = (): void => {
  localStorage.removeItem(HISTORY_STORAGE_KEY);
}; 