// 网速测试服务

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
      const response = await fetch(`${pingUrl}?cb=${Date.now()}`, { 
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
 * 测试下载速度
 */
export const testDownloadSpeed = async (
  onProgress: SpeedTestProgressCallback
): Promise<{ speed: number | null; dataPoints: SpeedDataPoint[] }> => {
  // 数据点记录
  const dataPoints: SpeedDataPoint[] = [];
  
  // 初始测试使用小文件
  const downloadUrl = `${SPEED_TEST_SERVER.baseUrl}${SPEED_TEST_SERVER.endpoints.download}`;
  
  let totalSpeed = 0;
  let validTests = 0;
  
  // 预热连接
  onProgress('download', 0, 0, []);
  try {
    await fetch(`${downloadUrl}?size=${TEST_SIZES.XS}&cb=${Date.now()}`, { 
      method: 'HEAD',
      cache: 'no-store'
    });
  } catch (error) {
    console.error('预热连接失败:', error);
  }
  
  // 第一阶段：初步测试，确定网络速度等级
  onProgress('download', 10, undefined, dataPoints);
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
    
    onProgress('download', 20, speedMbps, dataPoints);
  } catch (error) {
    console.error('初始速度测试失败:', error);
  }
  
  // 第二阶段：根据初始速度选择合适的文件大小
  const bestFileSize = await determineBestFileSize(initialSpeed);
  console.log(`基于初始速度 ${initialSpeed.toFixed(2)} Mbps 选择文件大小: ${bestFileSize}`);
  
  // 第三阶段：并发测试，使用4个并发连接
  onProgress('download', 30, undefined, dataPoints);
  const concurrentTests = 4;
  const concurrentPromises = [];
  
  for (let i = 0; i < concurrentTests; i++) {
    concurrentPromises.push((async () => {
      try {
        const cacheBuster = Date.now() + '-' + i;
        const startTime = performance.now();
        const response = await fetch(`${downloadUrl}?size=${bestFileSize}&cb=${cacheBuster}`, { 
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
        
        // 更新当前测试进度
        const testProgress = 30 + ((i + 1) / concurrentTests) * 50;
        
        // 添加数据点
        dataPoints.push({
          timestamp: Date.now(),
          speed: speedMbps
        });
        
        onProgress('download', testProgress, speedMbps, dataPoints);
        
        return speedMbps;
      } catch (error) {
        console.error(`并发下载测试 ${i+1} 失败:`, error);
        return null;
      }
    })());
  }
  
  // 等待所有并发测试完成
  const results = await Promise.all(concurrentPromises);
  const validResults = results.filter(r => r !== null) as number[];
  
  // 计算平均速度（排除异常值）
  if (validResults.length > 0) {
    // 如果有3个或更多结果，排除最高和最低
    let speedResults = validResults;
    if (validResults.length >= 3) {
      speedResults = [...validResults].sort((a, b) => a - b).slice(1, -1);
    }
    
    totalSpeed = speedResults.reduce((sum, speed) => sum + speed, 0);
    validTests = speedResults.length;
  }
  
  onProgress('download', 100, undefined, dataPoints);
  const finalSpeed = validTests > 0 ? Number((totalSpeed / validTests).toFixed(2)) : null;
  
  return { 
    speed: finalSpeed, 
    dataPoints 
  };
};

/**
 * 创建指定大小的随机二进制数据
 */
const createRandomBlob = (size: number): Blob => {
  const arr = new Uint8Array(size);
  crypto.getRandomValues(arr);
  return new Blob([arr]);
};

/**
 * 测试上传速度
 */
export const testUploadSpeed = async (
  onProgress: SpeedTestProgressCallback
): Promise<{ speed: number | null; dataPoints: SpeedDataPoint[] }> => {
  const dataPoints: SpeedDataPoint[] = [];
  
  onProgress('upload', 0, 0, []);
  
  // 测试上传端点
  const uploadUrl = `${SPEED_TEST_SERVER.baseUrl}${SPEED_TEST_SERVER.endpoints.upload}`;
  
  // 第一阶段：初步测试，确定网络速度等级
  onProgress('upload', 10, undefined, dataPoints);
  let initialSpeed = 0;
  try {
    // 小文件测试
    const blob = createRandomBlob(256 * 1024); // 256KB
    const formData = new FormData();
    formData.append('file', blob, 'speedtest.bin');
    
    const startTime = performance.now();
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      cache: 'no-store'
    });
    const endTime = performance.now();
    
    if (response.ok) {
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
      
      onProgress('upload', 20, speedMbps, dataPoints);
    }
  } catch (error) {
    console.error('初始上传速度测试失败:', error);
  }
  
  // 第二阶段：根据初始速度选择合适的文件大小
  // 上传测试文件大小一般要小一些，因为上传通常比下载慢
  let testSizes = [256 * 1024, 512 * 1024]; // 默认小文件
  
  if (initialSpeed > 5) {
    testSizes = [512 * 1024, 1024 * 1024]; // 中速连接
  }
  
  if (initialSpeed > 20) {
    testSizes = [1024 * 1024, 2 * 1024 * 1024]; // 高速连接
  }
  
  if (initialSpeed > 50) {
    testSizes = [2 * 1024 * 1024, 5 * 1024 * 1024]; // 超高速连接
  }
  
  // 第三阶段：正式测试
  let totalSpeed = 0;
  let validTests = 0;
  
  for (let i = 0; i < testSizes.length; i++) {
    const progress = 25 + ((i / testSizes.length) * 75);
    onProgress('upload', progress, undefined, dataPoints);
    
    // 每个文件大小测试2次
    for (let j = 0; j < 2; j++) {
      try {
        const blob = createRandomBlob(testSizes[i]);
        const formData = new FormData();
        formData.append('file', blob, `speedtest_${i}_${j}.bin`);
        
        const startTime = performance.now();
        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
          cache: 'no-store'
        });
        const endTime = performance.now();
        
        if (response.ok) {
          const durationInSeconds = (endTime - startTime) / 1000;
          const bitsUploaded = testSizes[i] * 8;
          const speedBps = (bitsUploaded / durationInSeconds);
          const speedMbps = speedBps / (1024 * 1024);
          
          // 添加数据点
          dataPoints.push({
            timestamp: Date.now(),
            speed: speedMbps
          });
          
          onProgress('upload', progress, speedMbps, dataPoints);
          
          totalSpeed += speedMbps;
          validTests++;
        }
      } catch (error) {
        console.error(`上传测试 文件大小:${testSizes[i]}, 重复:${j} 失败:`, error);
      }
      
      // 短暂暂停
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  onProgress('upload', 100, undefined, dataPoints);
  const finalSpeed = validTests > 0 ? Number((totalSpeed / validTests).toFixed(2)) : null;
  
  return { 
    speed: finalSpeed, 
    dataPoints 
  };
};

/**
 * 获取服务器信息
 */
export const getServerInfo = async (): Promise<{ name: string; location: string } | null> => {
  try {
    const infoUrl = `${SPEED_TEST_SERVER.baseUrl}${SPEED_TEST_SERVER.endpoints.info}`;
    const response = await fetch(infoUrl);
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