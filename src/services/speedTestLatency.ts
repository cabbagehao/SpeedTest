// 网络延迟和丢包测试模块

import { fetchWithThrottle, SPEED_TEST_SERVER } from './speedTestConfig';

/**
 * 测量网络延迟（ping）
 */
export const measurePing = async (): Promise<{ ping: number | null; jitter: number | null }> => {
  const pings: number[] = [];
  const pingUrl = `${SPEED_TEST_SERVER.baseUrl}${SPEED_TEST_SERVER.endpoints.ping}`;
  let connectionFailed = true;
  
  // 设置测试时间
  const MIN_TEST_TIME = 1000; // 最小测试时间1秒
  const MAX_TEST_TIME = 4000; // 最大测试时间4秒（最小+3秒）
  const PING_INTERVAL = 100; // 每次ping间隔：0.1秒
  const PING_TIMEOUT = 2000; // ping超时时间：2秒
  
  // 测试开始时间
  const testStartTime = performance.now();
  
  // 持续进行ping测试，直到达到最小测试时间
  while (performance.now() - testStartTime < MAX_TEST_TIME) {
    // 检查是否已满足最小测试时间且有足够的样本
    const elapsedTime = performance.now() - testStartTime;
    if (elapsedTime >= MIN_TEST_TIME && pings.length >= 5) {
      console.log(`Ping测试已满足最小条件，共${pings.length}个样本，用时${elapsedTime.toFixed(0)}ms`);
      break;
    }
    
    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT);
      
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
      
      console.log(`Ping成功: ${networkTime.toFixed(1)}ms`);
    } catch (error) {
      console.error('Ping测试失败:', error);
    }
    
    // 等待PING_INTERVAL时间后再发送下一个请求
    // 除非剩余时间不足以完成另一次测试
    const remainingTime = MAX_TEST_TIME - (performance.now() - testStartTime);
    if (remainingTime < PING_TIMEOUT + PING_INTERVAL) {
      console.log(`Ping测试剩余时间不足，停止发送更多请求`);
      break;
    }
    
    // 短暂等待后继续
    await new Promise(resolve => setTimeout(resolve, PING_INTERVAL));
  }
  
  // 如果所有连接都失败，返回null表示超时
  if (connectionFailed) {
    return { ping: null, jitter: null };
  }
  
  // 分析ping数据
  if (pings.length >= 3) {
    // 排除最高和最低值，计算平均ping值
    pings.sort((a, b) => a - b);
    const validPings = pings.slice(1, -1);
    const avgPing = validPings.reduce((sum, ping) => sum + ping, 0) / validPings.length;
    
    // 计算抖动（ping值的标准差）
    const pingVariance = validPings.reduce((sum, ping) => sum + Math.pow(ping - avgPing, 2), 0) / validPings.length;
    const jitter = Math.sqrt(pingVariance);
    
    console.log(`Ping测试完成：平均${Math.round(avgPing)}ms，抖动${Math.round(jitter)}ms，共${pings.length}个样本`);
    return { ping: Math.round(avgPing), jitter: Math.round(jitter) };
  } else if (pings.length > 0) {
    // 如果只有1-2个成功的ping，直接使用平均值
    const avgPing = pings.reduce((sum, ping) => sum + ping, 0) / pings.length;
    console.log(`Ping测试完成(样本少)：平均${Math.round(avgPing)}ms，共${pings.length}个样本`);
    return { ping: Math.round(avgPing), jitter: null };
  }
  
  return { ping: null, jitter: null };
};

/**
 * 测试丢包率
 */
export const measurePacketLoss = async (): Promise<number | null> => {
  const packetLossUrl = `${SPEED_TEST_SERVER.baseUrl}${SPEED_TEST_SERVER.endpoints.packetLoss}`;
  
  // 设置测试时间
  const MIN_TEST_TIME = 1000; // 最小测试时间1秒
  const MAX_TEST_TIME = 4000; // 最大测试时间4秒
  const REQUEST_INTERVAL = 50; // 每次请求间隔：0.05秒
  const REQUEST_TIMEOUT = 2000; // 请求超时时间：2秒
  
  let receivedPackets = 0;
  let sentPackets = 0;
  let allFailed = true;
  
  // 测试开始时间
  const testStartTime = performance.now();
  
  // 持续发送请求，直到达到最大测试时间
  while (performance.now() - testStartTime < MAX_TEST_TIME) {
    // 检查是否已满足最小测试时间且发送了足够的数据包
    const elapsedTime = performance.now() - testStartTime;
    if (elapsedTime >= MIN_TEST_TIME && sentPackets >= 10) {
      console.log(`丢包测试已满足最小条件，已发送${sentPackets}个数据包，用时${elapsedTime.toFixed(0)}ms`);
      break;
    }
    
    try {
      const id = Date.now() + '-' + sentPackets;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      
      sentPackets++;
      
      const response = await fetchWithThrottle(`${packetLossUrl}?id=${id}&cb=${Date.now()}`, { 
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      }).catch(() => null);
      
      clearTimeout(timeoutId);
      
      if (response && response.ok) {
        receivedPackets++;
        allFailed = false;
        console.log(`数据包 ${sentPackets} 接收成功`);
      } else {
        console.log(`数据包 ${sentPackets} 丢失`);
      }
    } catch (error) {
      // 超时或请求失败视为丢包
      console.log(`数据包 ${sentPackets} 请求异常: ${error}`);
    }
    
    // 等待REQUEST_INTERVAL时间后再发送下一个请求
    // 除非剩余时间不足以完成另一次测试
    const remainingTime = MAX_TEST_TIME - (performance.now() - testStartTime);
    if (remainingTime < REQUEST_TIMEOUT + REQUEST_INTERVAL) {
      console.log(`丢包测试剩余时间不足，停止发送更多请求`);
      break;
    }
    
    // 短暂等待后继续
    await new Promise(resolve => setTimeout(resolve, REQUEST_INTERVAL));
  }
  
  console.log(`丢包测试完成：发送${sentPackets}个数据包，接收${receivedPackets}个数据包`);
  
  // 如果所有请求都失败，返回null表示无法连接
  if (allFailed && sentPackets > 0) {
    return null;
  }
  
  // 计算丢包率（百分比）
  if (sentPackets === 0) return null;
  const packetLossRate = ((sentPackets - receivedPackets) / sentPackets) * 100;
  return Number(packetLossRate.toFixed(1));
}; 