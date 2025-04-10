// 网速测试工具函数

import { fetchWithThrottle, SPEED_TEST_SERVER } from './speedTestConfig';
import { ServerInfo } from './speedTestTypes';

/**
 * 创建指定大小的随机数据Blob
 * 优化版本，提高大文件生成性能
 */
export const createRandomBlob = (size: number): Blob => {
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
 * 获取服务器信息
 */
export const getServerInfo = async (): Promise<ServerInfo | null> => {
  // 最多尝试两次 (初次 + 1次重试)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const infoUrl = `${SPEED_TEST_SERVER.baseUrl}${SPEED_TEST_SERVER.endpoints.info}`;
      
      // 创建AbortController用于请求超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2秒超时
      
      const response = await fetchWithThrottle(infoUrl, {
        signal: controller.signal
      });
      
      // 清除超时
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        return {
          name: data.name,
          location: data.location
        };
      }
      
      // 第一次尝试失败后等待短暂时间再重试
      if (attempt === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`获取服务器信息失败(尝试 ${attempt + 1}/2):`, error);
      
      // 第一次尝试失败后等待短暂时间再重试
      if (attempt === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  // 所有尝试都失败
  return null;
}; 