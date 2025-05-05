// 网速测试配置模块

// 调试模式 - 设置为true可以查看更详细的日志
export const DEBUG_MODE = true;

// 测速服务器配置
export const SPEED_TEST_SERVER = {
  baseUrl: '/api',
  wsUrl: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`,
  endpoints: {
    info: '/server-info',
    ping: '/ping',
    download: '/download',
    upload: '/upload',
    uploadChunk: '/upload-chunk',
    packetLoss: '/packetloss',
    clientInfo: '/client-info',
    saveResult: '/save-result'
  }
};

// 测试文件大小（字节）
export const TEST_SIZES = {
  XS: 'xs', // 256KB
  S: 's',   // 1MB
  M: 'm',   // 5MB
  L: 'l',   // 10MB
  XL: 'xl'  // 100MB
};

// 测试设置配置
export const testSettings = {
  // 文件大小设置
  downloadFileSize: TEST_SIZES.S,  // 下载文件大小，默认1MB
  uploadFileSize: TEST_SIZES.S,    // 上传文件大小，默认1MB

  // 测试时间设置 (毫秒)
  downloadTestDuration: {
    min: 15000, // 最小测试时间，固定为15秒
    max: 15000  // 最大测试时间，固定为15秒
  },
  uploadTestDuration: {
    min: 8000,  // 最小测试时间，默认8秒
    max: 11000  // 最大测试时间，默认11秒 (最小值+3秒)
  },

  // 是否使用自动文件大小，默认为true（不使用手动选择）
  autoFileSize: true
};

/**
 * 更新测试设置
 */
export const updateTestSettings = (settings: Partial<typeof testSettings>): void => {
  Object.assign(testSettings, settings);

  if (DEBUG_MODE) {
    console.log('[测试设置] 已更新:', testSettings);
  }
};

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
export const fetchWithThrottle = async (url: string, options?: RequestInit): Promise<Response> => {
  // 无限速
  return fetch(url, options);
};