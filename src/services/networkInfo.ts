// 网络信息获取服务

import { SPEED_TEST_SERVER, API_BASE_URL } from './constants';

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