// 网络延迟和丢包测试模块

import { fetchWithThrottle, SPEED_TEST_SERVER } from './speedTestConfig';

/**
 * 测量网络延迟（ping）
 */
export const measurePing = async (): Promise<{ ping: number | null; jitter: number | null }> => {
  const pings: number[] = [];
  const pingUrl = `${SPEED_TEST_SERVER.baseUrl}${SPEED_TEST_SERVER.endpoints.ping}`;
  let connectionFailed = true;
  
  // 执行5次ping测试
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
      
      const response = await fetchWithThrottle(`${pingUrl}?cb=${Date.now()}`, { 
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
      connectionFailed = false;
    } catch (error) {
      console.error('Ping测试失败:', error);
    }
    // 等待一小段时间后再进行下一次测试
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // 如果所有连接都失败，返回null表示超时
  if (connectionFailed) {
    return { ping: null, jitter: null };
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
  
  return { ping: null, jitter: null };
};

/**
 * 测试丢包率
 */
export const measurePacketLoss = async (): Promise<number | null> => {
  const packetLossUrl = `${SPEED_TEST_SERVER.baseUrl}${SPEED_TEST_SERVER.endpoints.packetLoss}`;
  
  const totalPackets = 50;
  let receivedPackets = 0;
  let sentPackets = 0;
  const timeoutMs = 2000; // 2秒超时
  let allFailed = true;
  
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
      sentPackets++;
      
      if (response && response.ok) {
        receivedPackets++;
        allFailed = false;
      }
    } catch (error) {
      // 超时或请求失败视为丢包
      sentPackets++;
      console.log(`数据包 ${i} 丢失或超时`);
    }
    
    // 短暂间隔避免网络拥塞
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  // 如果所有请求都失败，返回null表示无法连接
  if (allFailed && sentPackets > 0) {
    return null;
  }
  
  // 计算丢包率（百分比）
  if (sentPackets === 0) return null;
  const packetLossRate = ((sentPackets - receivedPackets) / sentPackets) * 100;
  return Number(packetLossRate.toFixed(1));
}; 