// 视频会议质量测试服务

import { VideoConferenceTestResult } from './speedTestTypes';
import { SPEED_TEST_SERVER } from './speedTestConfig';

// 调试模式 - 设置为true可以查看更详细的日志
const DEBUG_MODE = true;

// 视频会议质量参数
const VIDEO_CONFERENCE_REQUIREMENTS = {
  // 上传带宽需求 (Mbps)
  uploadBandwidth: {
    lowQuality: 1, // 最低质量
    mediumQuality: 3, // 中等质量
    highQuality: 5 // 高质量
  },
  
  // 下载带宽需求 (Mbps)
  downloadBandwidth: {
    oneParticipant: 2, // 单人
    fewParticipants: 4, // 2-4人
    manyParticipants: 8 // 5人以上
  },
  
  // ping值阈值 (ms)
  ping: {
    excellent: 50,
    good: 100, 
    fair: 150,
    poor: 200
  },
  
  // 抖动阈值 (ms)
  jitter: {
    excellent: 10,
    good: 30,
    fair: 50,
    poor: 80
  },
  
  // 丢包率阈值 (%)
  packetLoss: {
    excellent: 0.5,
    good: 2,
    fair: 5,
    poor: 10
  }
};

/**
 * 模拟视频会议连接测试
 * @param uploadSpeed 上传速度 (Mbps)
 * @param downloadSpeed 下载速度 (Mbps)
 * @param ping 网络延迟 (ms)
 * @param jitter 抖动 (ms)
 * @param packetLoss 丢包率 (%)
 * @returns 模拟视频会议连接的结果
 */
const simulateVideoConference = (
  uploadSpeed: number,
  downloadSpeed: number,
  ping: number,
  jitter: number,
  packetLoss: number
): {
  videoQualityScore: number;
  audioQualityScore: number;
  stability: number;
  recommendedParticipants: number;
} => {
  // 基于上传带宽计算视频质量分数 (0-100)
  let videoQualityScore: number;
  const req = VIDEO_CONFERENCE_REQUIREMENTS.uploadBandwidth;
  
  if (uploadSpeed >= req.highQuality) {
    videoQualityScore = 90 + Math.min(10, (uploadSpeed - req.highQuality) / 5 * 10);
  } else if (uploadSpeed >= req.mediumQuality) {
    videoQualityScore = 60 + (uploadSpeed - req.mediumQuality) / (req.highQuality - req.mediumQuality) * 30;
  } else if (uploadSpeed >= req.lowQuality) {
    videoQualityScore = 30 + (uploadSpeed - req.lowQuality) / (req.mediumQuality - req.lowQuality) * 30;
  } else {
    videoQualityScore = Math.max(0, uploadSpeed / req.lowQuality * 30);
  }
  
  // 基于ping、jitter和丢包计算音频质量分数 (0-100)
  let audioQualityScore = 100;
  
  // ping对音频质量的影响
  if (ping >= VIDEO_CONFERENCE_REQUIREMENTS.ping.poor) {
    audioQualityScore -= 40;
  } else if (ping >= VIDEO_CONFERENCE_REQUIREMENTS.ping.fair) {
    audioQualityScore -= 20;
  } else if (ping >= VIDEO_CONFERENCE_REQUIREMENTS.ping.good) {
    audioQualityScore -= 10;
  } else if (ping >= VIDEO_CONFERENCE_REQUIREMENTS.ping.excellent) {
    audioQualityScore -= 5;
  }
  
  // 抖动对音频质量的影响
  if (jitter >= VIDEO_CONFERENCE_REQUIREMENTS.jitter.poor) {
    audioQualityScore -= 30;
  } else if (jitter >= VIDEO_CONFERENCE_REQUIREMENTS.jitter.fair) {
    audioQualityScore -= 15;
  } else if (jitter >= VIDEO_CONFERENCE_REQUIREMENTS.jitter.good) {
    audioQualityScore -= 5;
  } else if (jitter >= VIDEO_CONFERENCE_REQUIREMENTS.jitter.excellent) {
    audioQualityScore -= 2;
  }
  
  // 丢包率对音频质量的影响
  if (packetLoss >= VIDEO_CONFERENCE_REQUIREMENTS.packetLoss.poor) {
    audioQualityScore -= 40;
  } else if (packetLoss >= VIDEO_CONFERENCE_REQUIREMENTS.packetLoss.fair) {
    audioQualityScore -= 25;
  } else if (packetLoss >= VIDEO_CONFERENCE_REQUIREMENTS.packetLoss.good) {
    audioQualityScore -= 10;
  } else if (packetLoss >= VIDEO_CONFERENCE_REQUIREMENTS.packetLoss.excellent) {
    audioQualityScore -= 5;
  }
  
  // 确保分数在0-100范围内
  audioQualityScore = Math.max(0, Math.min(100, audioQualityScore));
  
  // 计算总体稳定性指数 (综合各项指标)
  // 权重: 下载带宽30%, 上传带宽30%, ping值20%, 抖动10%, 丢包率10%
  const downloadFactor = Math.min(100, downloadSpeed / VIDEO_CONFERENCE_REQUIREMENTS.downloadBandwidth.manyParticipants * 100);
  const uploadFactor = Math.min(100, uploadSpeed / VIDEO_CONFERENCE_REQUIREMENTS.uploadBandwidth.highQuality * 100);
  const pingFactor = Math.max(0, 100 - ping / VIDEO_CONFERENCE_REQUIREMENTS.ping.poor * 100);
  const jitterFactor = Math.max(0, 100 - jitter / VIDEO_CONFERENCE_REQUIREMENTS.jitter.poor * 100);
  const packetLossFactor = Math.max(0, 100 - packetLoss / VIDEO_CONFERENCE_REQUIREMENTS.packetLoss.poor * 100);
  
  const stability = downloadFactor * 0.3 + uploadFactor * 0.3 + pingFactor * 0.2 + jitterFactor * 0.1 + packetLossFactor * 0.1;
  
  // 计算推荐的最大参与人数
  let recommendedParticipants: number;
  const downloadReq = VIDEO_CONFERENCE_REQUIREMENTS.downloadBandwidth;
  
  if (downloadSpeed >= downloadReq.manyParticipants && uploadSpeed >= req.mediumQuality) {
    // 高带宽情况，基于实际带宽估算
    recommendedParticipants = Math.floor(downloadSpeed / 1.5); // 假设每个参与者需要平均1.5Mbps
    recommendedParticipants = Math.min(12, recommendedParticipants); // 限制最大值为12
  } else if (downloadSpeed >= downloadReq.fewParticipants) {
    recommendedParticipants = 4;
  } else if (downloadSpeed >= downloadReq.oneParticipant) {
    recommendedParticipants = 2;
  } else {
    recommendedParticipants = 1;
  }
  
  // 如果稳定性较差，降低推荐人数
  if (stability < 50) {
    recommendedParticipants = Math.max(1, recommendedParticipants - 2);
  } else if (stability < 70) {
    recommendedParticipants = Math.max(1, recommendedParticipants - 1);
  }
  
  return {
    videoQualityScore: Math.round(videoQualityScore),
    audioQualityScore: Math.round(audioQualityScore),
    stability: Math.round(stability),
    recommendedParticipants
  };
};

/**
 * 执行视频会议质量测试
 * @param uploadSpeed 上传速度 (Mbps)
 * @param downloadSpeed 下载速度 (Mbps)
 * @param ping 网络延迟 (ms)
 * @param jitter 抖动 (ms)
 * @param packetLoss 丢包率 (%)
 * @param progressCallback 进度回调函数
 * @returns 视频会议质量测试结果
 */
export const testVideoConferenceQuality = async (
  uploadSpeed: number,
  downloadSpeed: number,
  ping: number,
  jitter: number,
  packetLoss: number,
  progressCallback?: (progress: number, stage: string) => void
): Promise<VideoConferenceTestResult> => {
  if (DEBUG_MODE) {
    console.log(`开始视频会议质量测试，上传: ${uploadSpeed}Mbps, 下载: ${downloadSpeed}Mbps, ping: ${ping}ms`);
  }
  
  // 更新初始进度
  if (progressCallback) {
    progressCallback(0, '启动视频会议质量测试');
  }
  
  const testStartTime = performance.now();
  
  // 添加延迟模拟测试过程
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (progressCallback) {
    progressCallback(30, '分析网络参数');
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (progressCallback) {
    progressCallback(60, '模拟视频会议连接');
  }
  
  // 执行模拟视频会议质量测试
  const simulationResult = simulateVideoConference(
    uploadSpeed,
    downloadSpeed,
    ping,
    jitter,
    packetLoss
  );
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (progressCallback) {
    progressCallback(100, '完成视频会议质量测试');
  }
  
  // 构造测试结果
  const result: VideoConferenceTestResult = {
    ...simulationResult,
    timestamp: Date.now()
  };
  
  if (DEBUG_MODE) {
    const testDuration = performance.now() - testStartTime;
    console.log(`视频会议质量测试完成，耗时: ${(testDuration / 1000).toFixed(2)}秒`);
    console.log('视频会议质量测试结果:', result);
  }
  
  return result;
};

/**
 * 获取视频会议质量评估
 * @param result 视频会议质量测试结果
 * @returns 视频会议质量评估描述
 */
export const getVideoConferenceAssessment = (result: VideoConferenceTestResult): string => {
  // 视频质量描述
  let videoQualityDesc: string;
  if (result.videoQualityScore >= 90) {
    videoQualityDesc = '高清晰度';
  } else if (result.videoQualityScore >= 70) {
    videoQualityDesc = '清晰';
  } else if (result.videoQualityScore >= 50) {
    videoQualityDesc = '一般';
  } else if (result.videoQualityScore >= 30) {
    videoQualityDesc = '较模糊';
  } else {
    videoQualityDesc = '低质量';
  }
  
  // 音频质量描述
  let audioQualityDesc: string;
  if (result.audioQualityScore >= 90) {
    audioQualityDesc = '清晰无延迟';
  } else if (result.audioQualityScore >= 70) {
    audioQualityDesc = '清晰偶有卡顿';
  } else if (result.audioQualityScore >= 50) {
    audioQualityDesc = '可接受';
  } else if (result.audioQualityScore >= 30) {
    audioQualityDesc = '经常断续';
  } else {
    audioQualityDesc = '通话困难';
  }
  
  // 稳定性描述
  let stabilityDesc: string;
  if (result.stability >= 80) {
    stabilityDesc = '非常稳定';
  } else if (result.stability >= 60) {
    stabilityDesc = '稳定';
  } else if (result.stability >= 40) {
    stabilityDesc = '一般';
  } else {
    stabilityDesc = '不稳定';
  }
  
  return `视频质量: ${videoQualityDesc} (${result.videoQualityScore}分) | 音频质量: ${audioQualityDesc} (${result.audioQualityScore}分) | 推荐参与人数: ${result.recommendedParticipants}人 | 连接稳定性: ${stabilityDesc}`;
}; 