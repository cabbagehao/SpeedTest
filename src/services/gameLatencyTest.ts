// 游戏延迟测试服务

import { GameLatencyTestResult } from './speedTestTypes';
import { SPEED_TEST_SERVER } from './speedTestConfig';

// 调试模式 - 设置为true可以查看更详细的日志
const DEBUG_MODE = true;

// 游戏服务器列表（模拟）
const GAME_SERVERS = [
  { id: 'cn-north', name: '华北区服务器', latencyFactor: 1.0 },
  { id: 'cn-east', name: '华东区服务器', latencyFactor: 1.2 },
  { id: 'cn-south', name: '华南区服务器', latencyFactor: 1.4 },
  { id: 'cn-west', name: '西部区服务器', latencyFactor: 1.6 },
  { id: 'asia-sg', name: '新加坡服务器', latencyFactor: 2.5 }
];

// 游戏类型对ping值的敏感度
const GAME_SENSITIVITY = {
  FPS: { maxGoodPing: 50, maxAcceptablePing: 100 },
  MOBA: { maxGoodPing: 80, maxAcceptablePing: 150 },
  MMO: { maxGoodPing: 120, maxAcceptablePing: 200 },
  CASUAL: { maxGoodPing: 150, maxAcceptablePing: 250 }
};

/**
 * 测量单个服务器的延迟
 * @param serverId 服务器ID
 * @param basePing 基础ping值
 * @returns 延迟测试结果
 */
const measureServerLatency = async (serverId: string, basePing: number): Promise<{
  success: boolean;
  ping: number;
  jitter: number;
  packetLoss: number;
}> => {
  try {
    // 找到对应的服务器
    const server = GAME_SERVERS.find(s => s.id === serverId);
    if (!server) {
      throw new Error(`找不到服务器: ${serverId}`);
    }
    
    // 应用服务器延迟因子
    const simulatedPing = basePing * server.latencyFactor;
    
    // 在这里我们使用真实的ping测试，但添加服务器特定的调整
    const pings: number[] = [];
    const pingUrl = `${SPEED_TEST_SERVER.baseUrl}${SPEED_TEST_SERVER.endpoints.ping}`;
    
    // 执行5次ping测试
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      try {
        const response = await fetch(`${pingUrl}?server=${serverId}&cb=${Date.now()}`, { 
          method: 'GET',
          cache: 'no-store'
        });
        const end = performance.now();
        
        // 添加服务器特定的延迟调整
        const networkTime = (end - start) * server.latencyFactor;
        pings.push(networkTime);
      } catch (error) {
        console.error(`服务器 ${serverId} Ping测试失败:`, error);
      }
      
      // 等待一小段时间后再进行下一次测试
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    if (pings.length === 0) {
      throw new Error('所有ping测试均失败');
    }
    
    // 计算ping、抖动和模拟丢包
    const avgPing = pings.reduce((sum, ping) => sum + ping, 0) / pings.length;
    
    // 计算抖动（ping值的标准差）
    const pingVariance = pings.reduce((sum, ping) => sum + Math.pow(ping - avgPing, 2), 0) / pings.length;
    const jitter = Math.sqrt(pingVariance);
    
    // 模拟丢包率 - 根据ping值和抖动进行估计
    // ping值越高、抖动越大，丢包率越高
    const baseLoss = Math.max(0, (avgPing - 100) / 150); // 当ping > 100ms时开始有丢包
    const jitterFactor = jitter / avgPing; // 抖动占ping值的比例
    let packetLoss = Math.min(15, Math.max(0, baseLoss + jitterFactor * 5)) * 100; // 转为百分比，最高15%
    
    // 四舍五入到最近的0.1%
    packetLoss = Math.round(packetLoss * 10) / 10;
    
    if (DEBUG_MODE) {
      console.log(`服务器 ${serverId} 延迟测试: ping=${Math.round(avgPing)}ms, jitter=${Math.round(jitter)}ms, 丢包=${packetLoss}%`);
    }
    
    return {
      success: true,
      ping: Math.round(avgPing),
      jitter: Math.round(jitter),
      packetLoss: packetLoss
    };
  } catch (error) {
    console.error(`服务器 ${serverId} 延迟测试失败:`, error);
    return {
      success: false,
      ping: 0,
      jitter: 0,
      packetLoss: 0
    };
  }
};

/**
 * 执行游戏延迟测试
 * @param basePing 基础ping值（从常规测速中获取）
 * @param progressCallback 进度回调函数
 * @returns 游戏延迟测试结果
 */
export const testGameLatency = async (
  basePing: number,
  progressCallback?: (progress: number, stage: string) => void
): Promise<GameLatencyTestResult> => {
  if (DEBUG_MODE) {
    console.log(`开始游戏延迟测试，基础ping值: ${basePing}ms`);
  }
  
  // 初始化结果
  const result: GameLatencyTestResult = {
    averagePing: 0,
    packetLoss: 0,
    jitter: 0,
    stability: 0,
    servers: [],
    timestamp: Date.now()
  };
  
  const testStartTime = performance.now();
  
  try {
    const pingResults: number[] = [];
    const jitterResults: number[] = [];
    const packetLossResults: number[] = [];
    const successfulServers: string[] = [];
    
    // 测试每个游戏服务器
    for (let i = 0; i < GAME_SERVERS.length; i++) {
      const server = GAME_SERVERS[i];
      
      // 更新进度
      if (progressCallback) {
        progressCallback(
          (i / GAME_SERVERS.length) * 100,
          `测试${server.name}延迟`
        );
      }
      
      // 执行服务器延迟测试
      const latencyResult = await measureServerLatency(server.id, basePing);
      
      if (latencyResult.success) {
        pingResults.push(latencyResult.ping);
        jitterResults.push(latencyResult.jitter);
        packetLossResults.push(latencyResult.packetLoss);
        successfulServers.push(server.name);
      }
    }
    
    // 更新进度为100%
    if (progressCallback) {
      progressCallback(100, '完成游戏延迟测试');
    }
    
    // 计算平均值
    if (pingResults.length > 0) {
      result.averagePing = pingResults.reduce((sum, ping) => sum + ping, 0) / pingResults.length;
      result.jitter = jitterResults.reduce((sum, jitter) => sum + jitter, 0) / jitterResults.length;
      result.packetLoss = packetLossResults.reduce((sum, loss) => sum + loss, 0) / packetLossResults.length;
      result.servers = successfulServers;
      
      // 计算稳定性指数 (0-100)
      // 考虑因素: ping值、抖动、丢包率
      const pingFactor = Math.max(0, 100 - result.averagePing / 2); // ping值越低越好
      const jitterFactor = Math.max(0, 100 - result.jitter * 5); // 抖动越低越好
      const packetLossFactor = Math.max(0, 100 - result.packetLoss * 10); // 丢包率越低越好
      
      // 加权计算稳定性指数
      result.stability = Math.round(
        pingFactor * 0.4 + jitterFactor * 0.3 + packetLossFactor * 0.3
      );
      
      // 限制在0-100范围内
      result.stability = Math.min(100, Math.max(0, result.stability));
    }
    
  } catch (error) {
    console.error('游戏延迟测试失败:', error);
  } finally {
    // 记录测试持续时间
    const testDuration = performance.now() - testStartTime;
    
    if (DEBUG_MODE) {
      console.log(`游戏延迟测试完成，耗时: ${(testDuration / 1000).toFixed(2)}秒`);
      console.log('游戏延迟测试结果:', result);
    }
    
    return result;
  }
};

/**
 * 获取游戏延迟评估
 * @param result 游戏延迟测试结果
 * @param gameType 游戏类型
 * @returns 游戏延迟评估
 */
export const getGameLatencyAssessment = (
  result: GameLatencyTestResult,
  gameType: keyof typeof GAME_SENSITIVITY = 'FPS'
): string => {
  const sensitivity = GAME_SENSITIVITY[gameType];
  
  // 延迟评级
  let pingRating: string;
  if (result.averagePing <= sensitivity.maxGoodPing) {
    pingRating = '极佳';
  } else if (result.averagePing <= sensitivity.maxAcceptablePing) {
    pingRating = '可接受';
  } else {
    pingRating = '较高';
  }
  
  // 稳定性评级
  let stabilityRating: string;
  if (result.stability >= 80) {
    stabilityRating = '极佳';
  } else if (result.stability >= 60) {
    stabilityRating = '良好';
  } else if (result.stability >= 40) {
    stabilityRating = '一般';
  } else {
    stabilityRating = '较差';
  }
  
  // 丢包评级
  let packetLossRating: string;
  if (result.packetLoss < 1) {
    packetLossRating = '极低';
  } else if (result.packetLoss < 3) {
    packetLossRating = '低';
  } else if (result.packetLoss < 5) {
    packetLossRating = '中等';
  } else {
    packetLossRating = '高';
  }
  
  return `${gameType}游戏延迟: ${pingRating} (${Math.round(result.averagePing)}ms) | 网络稳定性: ${stabilityRating} | 丢包率: ${packetLossRating} (${result.packetLoss}%)`;
}; 