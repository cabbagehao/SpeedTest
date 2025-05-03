// 网速测试类型定义

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

// 服务器信息类型
export interface ServerInfo {
  name: string;
  location: string;
}

// 在线视频测试结果
export interface StreamingTestResult {
  canStream1080p: boolean;
  canStream4K: boolean;
  bufferingIndex: number; // 缓冲指数 (0-100)，越低越好
  recommendedQuality: string; // 推荐的最高质量 ('480p' | '720p' | '1080p' | '4K')
  downloadSpeed: number; // 平均下载速度（mbps），这里添加了downloadSpeed字段
  timestamp?: number;
}

// 网页加载测试结果
export interface WebLoadingTestResult {
  averageLoadTime: number; // 平均加载时间(ms)
  firstContentfulPaint: number; // 首次内容绘制时间(ms)
  fullLoadTime: number; // 完全加载时间(ms)
  testSites: string[]; // 测试的网站
  timestamp: number;
}

// 游戏延迟测试结果
export interface GameLatencyTestResult {
  averagePing: number; // 平均ping值(ms)
  packetLoss: number; // 丢包率(%)
  jitter: number; // 抖动(ms)
  stability: number; // 稳定性指数(0-100)，越高越好
  servers: string[]; // 测试的游戏服务器
  timestamp: number;
} 