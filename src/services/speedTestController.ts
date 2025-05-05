// 网速测试控制器 - 整合所有测速功能

import { SpeedTestProgressCallback, SpeedTestResult, StageCompleteCallback } from './speedTestTypes';
import { measurePing, measurePacketLoss, getServerInfo } from './networkInfo';
import { testDownloadSpeed } from './downloadTest';
import { testUploadSpeed } from './uploadTest';
import { testStabilityDownloadSpeed, testStabilityUploadSpeed } from './stabilityTest';
import { saveTestHistory, saveResultToServer } from './speedTestUtils';

/**
 * 执行完整的网速测试
 */
export const runSpeedTest = async (
  onProgress: SpeedTestProgressCallback,
  onStageComplete?: StageCompleteCallback,
  isStabilityTest: boolean = false // 添加参数，用于区分是否为稳定性测试
): Promise<SpeedTestResult> => {
  // 进度分配 - 总进度为100%，根据测试时间分配
  // 服务器信息: 5%
  // Ping测试: 10%
  // 丢包率测试: 15%
  // 下载测试: 45% (15秒)
  // 上传测试: 25% (12秒)
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
  const updateProgress = async (stage: string, stageProgress: number, currentSpeed?: number, dataPoints?: any) => {
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
  let serverInfo: { name: string; location: string } = {
    name: '高性能测速服务器',
    location: '未知位置'
  };

  updateProgress('init', 0);
  try {
    // 设置获取服务器信息的超时处理
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 3000); // 3秒超时，从5秒修改为3秒
    });

    // 使用Promise.race确保请求不会无限等待
    const info = await Promise.race([
      getServerInfo(),
      timeoutPromise
    ]);

    if (info) {
      serverInfo = info;
    }
  } catch (error) {
    console.error('无法获取服务器信息:', error);
  } finally {
    // 无论是否成功，都更新进度并继续后续测试步骤
    await updateProgress('init', 100);
  }

  // 1. 测量ping
  let pingResult: { ping: number | null; jitter: number | null } = { ping: null, jitter: null };
  try {
    // 添加ping测试的整体超时保护
    const pingTimeoutPromise = new Promise<{ ping: number | null; jitter: number | null }>((resolve) => {
      setTimeout(() => resolve({ ping: null, jitter: null }), 5000); // 5秒整体超时
    });

    // 单个ping请求已经有3秒超时，这里是整体超时
    pingResult = await Promise.race([
      measurePing(),
      pingTimeoutPromise
    ]);
  } catch (error) {
    console.error('Ping测试失败:', error);
  }
  finalResult.ping = pingResult.ping;
  finalResult.jitter = pingResult.jitter;
  await updateProgress('ping', 100);

  // 通知ping测试完成
  finalResult.testServer = `${serverInfo.name} (${serverInfo.location})`;
  if (onStageComplete) {
    onStageComplete('ping', {...finalResult});
  }

  // 2. 测试丢包率
  let packetLossResult = null;
  try {
    // 丢包率测试已有单个请求超时机制(2秒)，这里添加整体阶段超时保护
    const packetLossTimeoutPromise = new Promise<number>((resolve) => {
      setTimeout(() => resolve(0), 10000); // 10秒整体超时
    });

    packetLossResult = await Promise.race([
      measurePacketLoss(),
      packetLossTimeoutPromise
    ]);
  } catch (error) {
    console.error('丢包率测试失败:', error);
  }
  finalResult.packetLoss = packetLossResult;
  await updateProgress('packetLoss', 100);

  // 通知丢包率测试完成
  if (onStageComplete) {
    onStageComplete('packetLoss', {...finalResult});
  }

  // 3. 测试下载速度
  const progressDownloadCallback = (stage: string, progress: number, speed?: number, dataPoints?: any) => {
    updateProgress('download', progress, speed, dataPoints);
    if (progress === 100 && speed !== undefined) {
      finalResult.downloadSpeed = speed;
      finalResult.downloadDataPoints = dataPoints || [];
    }
  };

  let downloadSpeed: number | null = null;
  let downloadDataPoints: any[] = [];

  try {
    // 移除下载测试的超时限制，改为依赖testDownloadSpeed内部的定时结束机制
    const result = await testDownloadSpeed(progressDownloadCallback, isStabilityTest);

    downloadSpeed = result.speed;
    downloadDataPoints = result.dataPoints;

    finalResult.downloadSpeed = downloadSpeed;
    finalResult.downloadDataPoints = downloadDataPoints;
  } catch (error) {
    console.error('下载测试失败:', error);
    // 检查进度回调是否已经设置了downloadSpeed
    if (finalResult.downloadSpeed === undefined || finalResult.downloadSpeed === null) {
      finalResult.downloadSpeed = null;
    }
    // 确保进度条完成
    updateProgress('download', 100);
  }

  // 通知下载测试完成
  if (onStageComplete) {
    onStageComplete('download', {...finalResult});
  }

  // 下载完成后，平滑过渡到上传阶段
  await smoothTransition(totalProgress, 75, 'download');

  // 4. 测试上传速度
  const progressUploadCallback = (stage: string, progress: number, speed?: number, dataPoints?: any) => {
    // 始终传递真实速度值
    updateProgress('upload', progress, speed, dataPoints);
    if (progress === 100 && speed !== undefined) {
      finalResult.uploadSpeed = speed;
      finalResult.uploadDataPoints = dataPoints || [];
    }
  };

  let uploadSpeed: number | null = null;
  let uploadDataPoints: any[] = [];

  try {
    // 增加超时时间
    const uploadTimeoutPromise = new Promise<{ speed: number | null; dataPoints: any[] }>((_, reject) => {
      setTimeout(() => {
        reject(new Error('上传测试超时（12秒）'));
      }, 12000); // 改为12秒，与上传测试最大时间匹配
    });

    const result = await Promise.race([
      testUploadSpeed(progressUploadCallback, isStabilityTest),
      uploadTimeoutPromise
    ]);

    uploadSpeed = result.speed;
    uploadDataPoints = result.dataPoints;

    finalResult.uploadSpeed = uploadSpeed;
    finalResult.uploadDataPoints = uploadDataPoints;
  } catch (error) {
    console.error('上传测试失败:', error);
    // 检查进度回调是否已经设置了uploadSpeed
    if (finalResult.uploadSpeed === undefined || finalResult.uploadSpeed === null) {
      finalResult.uploadSpeed = null;
    }
    // 确保进度条完成
    updateProgress('upload', 100);
  }

  // 确保最终进度为100%
  const completeResult: SpeedTestResult = {
    downloadSpeed: finalResult.downloadSpeed ?? null,
    uploadSpeed: finalResult.uploadSpeed ?? null,
    ping: finalResult.ping ?? null,
    jitter: finalResult.jitter ?? null,
    packetLoss: finalResult.packetLoss ?? null,
    testServer: finalResult.testServer || 'Unknown',
    timestamp: finalResult.timestamp || Date.now(),
    downloadDataPoints: finalResult.downloadDataPoints || [],
    uploadDataPoints: finalResult.uploadDataPoints || []
  };

  // 通知上传测试完成
  if (onStageComplete) {
    onStageComplete('upload', completeResult);
  }

  // 5. 保存结果到本地
  saveTestHistory(completeResult);

  // 6. 保存结果到服务器
  try {
    // 添加保存结果的超时保护
    const saveTimeoutPromise = new Promise<void>((resolve) => {
      setTimeout(resolve, 5000); // 5秒超时
    });

    await Promise.race([
      saveResultToServer(completeResult),
      saveTimeoutPromise
    ]);
  } catch (error) {
    console.error('保存结果到服务器失败:', error);
    // 继续执行，不中断测试流程
  }

  // 最终平滑过渡到100%
  await smoothTransition(totalProgress, 100, 'upload');

  return completeResult;
};

// 导出稳定性测试接口
export { testStabilityDownloadSpeed, testStabilityUploadSpeed };