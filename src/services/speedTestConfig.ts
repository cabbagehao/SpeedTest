// 网速测试配置模块

// 调试模式 - 设置为true可以查看更详细的日志
export const DEBUG_MODE = true;

// 测速服务器配置
export const SPEED_TEST_SERVER = {
  baseUrl: 'http://localhost:3001/api',
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
export const TEST_SIZES = {
  XS: 'xs', // 256KB
  S: 's',   // 1MB
  M: 'm',   // 5MB
  L: 'l',   // 10MB
  XL: 'xl'  // 100MB
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
export const fetchWithThrottle = async (url: string, options?: RequestInit): Promise<Response> => {
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