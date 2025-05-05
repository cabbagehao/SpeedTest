// 速度测试服务常量

// 调试模式 - 设置为true可以查看更详细的日志
export const DEBUG_MODE = true;

// 服务器API基础URL - 修改为使用当前主机地址
export const API_BASE_URL = `${window.location.origin}/api`;

// 自定义CDN下载测试文件URL
export const CDN_DOWNLOAD_URL = [
  // 'https://d1iik5tm2hadjt.cloudfront.net/Fedora-Workstation-Live-42-1.1.x86_64.iso',
  // 'https://d1iik5tm2hadjt.cloudfront.net/Cursor-darwin-universal.dmg',
  // 'http://speedtest.voicee.cn/Fedora-Workstation-Live-x86_64-38-1.6.iso',
  'http://speedtest.voicee.cn/Cursor-darwin-universal.dmg',
];

// 测速服务器配置
export const SPEED_TEST_SERVER = {
  baseUrl: API_BASE_URL,
  wsUrl: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`,
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
export const TEST_SIZES = {
  XS: 'xs', // 256KB
  S: 's',   // 1MB
  M: 'm',   // 5MB
  L: 'l',   // 10MB
  XL: 'xl'  // 100MB
};

// 测速历史存储键
export const HISTORY_STORAGE_KEY = 'speedtest_history';

// 测试配置常量
export const TEST_DURATION_CONFIG = {
  INTERVAL_CHECK_MS: 250,         // 速度检查间隔
  DATA_STABILITY_THRESHOLD_SEC: 10, // 剔除前10秒的数据，因为6个线程同时启动需要10秒钟（每个线程间隔2秒启动）
  MIN_DATA_POINTS: 5
};