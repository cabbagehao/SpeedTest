// 网速测试主控制模块
// 集成所有测试功能并提供统一API

// 导入配置项
import { SPEED_TEST_SERVER } from './speedTestConfig';

// 导入类型定义
import { 
  SpeedTestProgressCallback,
  SpeedTestResult,
  SpeedDataPoint,
  ServerInfo
} from './speedTestTypes';

// 导入单独的测试模块
import { measurePing, measurePacketLoss } from './speedTestLatency';
import { testDownloadSpeed } from './speedTestDownload';
import { testUploadSpeed } from './speedTestUpload';
import { getServerInfo } from './speedTestUtils';

// 重新导出所有API
export * from './speedTestTypes';
export * from './speedTestConfig';
export * from './speedTestLatency';
export * from './speedTestDownload';
export * from './speedTestUpload';
export * from './speedTestUtils';

/**
 * 执行完整的网速测试
 */
export const runSpeedTest = async (
  onProgress: SpeedTestProgressCallback,
  onStageComplete?: (stageName: string, result: Partial<SpeedTestResult>) => void
): Promise<SpeedTestResult> => {
  // 进度分配 - 总进度为100%，根据测试时间分配
  // 服务器信息: 5%
  // Ping测试: 10% 
  // 丢包率测试: 15%
  // 下载测试: 45% (12秒)
  // 上传测试: 25% (10秒)
  let totalProgress = 0;
  
  // 存储最终结果
  let finalResult: Partial<SpeedTestResult> = {
    timestamp: Date.now()
  };
  
  // 平滑过渡设置
  const SMOOTH_TRANSITION_INTERVAL = 50; // 更新间隔(ms)
  const SMOOTH_TRANSITION_STEP = 0.5; // 每次更新增加的进度百分比
  
  // 创建平滑过渡动画
  const smoothTransition = async (fromProgress: number, toProgress: number, stage: string) => {
    let currentProgress = fromProgress;
    
    while (currentProgress < toProgress) {
      currentProgress = Math.min(currentProgress + SMOOTH_TRANSITION_STEP, toProgress);
      // 使用相同的stage防止进度条颜色变化
      onProgress(stage, Math.round(currentProgress), (finalResult.uploadSpeed || undefined));
      
      if (currentProgress >= toProgress) break;
      await new Promise(resolve => setTimeout(resolve, SMOOTH_TRANSITION_INTERVAL));
    }
  };
  
  // 进度更新包装函数
  const updateProgress = async (stage: string, stageProgress: number, currentSpeed?: number, dataPoints?: SpeedDataPoint[]) => {
    let absoluteProgress = 0;
    
    switch(stage) {
      case 'init':
        absoluteProgress = (stageProgress / 100) * 5;
        break;
      case 'ping':
        absoluteProgress = 5 + (stageProgress / 100) * 10;
        break;
      case 'packetLoss':
        absoluteProgress = 15 + (stageProgress / 100) * 15;
        break;
      case 'download':
        absoluteProgress = 30 + (stageProgress / 100) * 45;
        break;
      case 'upload':
        absoluteProgress = 75 + (stageProgress / 100) * 25;
        break;
      default:
        absoluteProgress = stageProgress;
    }
    
    // 如果是阶段性的100%进度，先更新到95%，然后平滑过渡
    if (stageProgress === 100 && absoluteProgress > totalProgress + 5) {
      const transitionTo = absoluteProgress - 5;
      if (transitionTo > totalProgress) {
        await smoothTransition(totalProgress, transitionTo, stage);
        totalProgress = transitionTo;
      }
    }
    
    // 更新总进度
    if (Math.round(absoluteProgress) > totalProgress) {
      totalProgress = Math.round(absoluteProgress);
      
      // 始终显示当前速度，不管是什么阶段
      onProgress(stage, totalProgress, currentSpeed, dataPoints);
    }
  };
  
  // 0. 获取服务器信息
  let serverInfo: ServerInfo = { 
    name: '高性能测速服务器', 
    location: '未知位置' 
  };
  
  updateProgress('init', 0);
  try {
    const info = await getServerInfo();
    if (info) {
      serverInfo = info;
    }
  } catch (error) {
    console.error('无法获取服务器信息:', error);
  }
  await updateProgress('init', 100);
  
  // 1. 测量ping
  const { ping, jitter } = await measurePing();
  finalResult.ping = ping;
  finalResult.jitter = jitter;
  await updateProgress('ping', 100);
  
  // 通知ping测试完成
  finalResult.testServer = `${serverInfo.name} (${serverInfo.location})`;
  if (onStageComplete) {
    onStageComplete('ping', {...finalResult});
  }
  
  // 2. 测试丢包率
  const packetLoss = await measurePacketLoss();
  finalResult.packetLoss = packetLoss;
  await updateProgress('packetLoss', 100);
  
  // 通知丢包率测试完成
  if (onStageComplete) {
    onStageComplete('packetLoss', {...finalResult});
  }
  
  // 3. 测试下载速度
  const progressDownloadCallback = (stage: string, progress: number, speed?: number, dataPoints?: SpeedDataPoint[]) => {
    updateProgress('download', progress, speed, dataPoints);
    if (progress === 100 && speed !== undefined) {
      finalResult.downloadSpeed = speed;
      finalResult.downloadDataPoints = dataPoints || [];
    }
  };
  
  const { speed: downloadSpeed, dataPoints: downloadDataPoints } = 
    await testDownloadSpeed(progressDownloadCallback);
  
  finalResult.downloadSpeed = downloadSpeed;
  finalResult.downloadDataPoints = downloadDataPoints;
  
  // 通知下载测试完成
  if (onStageComplete) {
    onStageComplete('download', {...finalResult});
  }
  
  // 下载完成后，平滑过渡到上传阶段
  await smoothTransition(totalProgress, 75, 'download');
  
  // 4. 测试上传速度
  const progressUploadCallback = (stage: string, progress: number, speed?: number, dataPoints?: SpeedDataPoint[]) => {
    // 始终传递真实速度值
    updateProgress('upload', progress, speed, dataPoints);
    if (progress === 100 && speed !== undefined) {
      finalResult.uploadSpeed = speed;
      finalResult.uploadDataPoints = dataPoints || [];
    }
  };
  
  const { speed: uploadSpeed, dataPoints: uploadDataPoints } = 
    await testUploadSpeed(progressUploadCallback);
  
  finalResult.uploadSpeed = uploadSpeed;
  finalResult.uploadDataPoints = uploadDataPoints;
  
  // 通知上传测试完成
  if (onStageComplete) {
    onStageComplete('upload', {...finalResult});
  }
  
  // 上传测试完成后，平滑过渡到100%
  if (totalProgress < 100) {
    await smoothTransition(totalProgress, 100, 'upload');
    
    // 最终更新一次，显示上传速度
    onProgress('upload', 100, uploadSpeed || undefined, uploadDataPoints);
  }
  
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