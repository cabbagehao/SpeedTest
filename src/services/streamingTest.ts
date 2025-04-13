// 流媒体播放能力测试服务

import { StreamingTestResult } from './speedTestTypes';
import { SPEED_TEST_SERVER } from './speedTestConfig';

// 调试模式 - 设置为true可以查看更详细的日志
const DEBUG_MODE = true;

// 视频质量级别的最低带宽需求 (Mbps)
const QUALITY_BANDWIDTH_REQUIREMENTS = {
  '480p': 2.5,
  '720p': 5,
  '1080p': 8,
  '4K': 25
};

// 缓冲指数阈值 - 低于此值认为有良好的流媒体体验
const BUFFER_INDEX_THRESHOLD = 30;

// 测试视频URL - 不同分辨率的视频样本
const TEST_VIDEOS = [
  { 
    resolution: '480p', 
    url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/480/Big_Buck_Bunny_480_10s_1MB.mp4'
  },
  { 
    resolution: '720p', 
    url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_3MB.mp4'
  },
  { 
    resolution: '1080p', 
    url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_5MB.mp4'
  },
  { 
    resolution: '4K', 
    url: 'https://test-videos.co.uk/vids/jellyfish/mp4/uhd/jellyfish-3840-10-20-120.mp4'
  }
];

/**
 * 测试视频段的加载性能
 * @param videoUrl 视频URL
 * @returns 加载性能测试结果
 */
const testVideoSegmentLoading = async (
  videoUrl: string
): Promise<{
  success: boolean;
  loadTime: number;
  bufferRatio: number;
  downloadSpeed: number;
}> => {
  const startTime = performance.now();
  
  try {
    // 测量视频加载时间
    const response = await fetch(videoUrl, { 
      method: 'GET', 
      cache: 'no-store',
      headers: { Range: 'bytes=0-1000000' } // 只获取前1MB来测试加载性能
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    // 获取文件的部分内容
    const blob = await response.blob();
    const loadTime = performance.now() - startTime;
    
    // 计算下载速度 (Mbps)
    const downloadedSize = blob.size; // 字节
    const downloadTime = loadTime / 1000; // 秒
    const downloadSpeed = (downloadedSize * 8) / downloadTime / 1000000; // 转换为Mbps
    
    // 计算缓冲比率 (实际加载时间 vs 视频长度比例)
    // 假设视频长度为10秒
    const videoDuration = 10; // 秒
    const idealLoadTime = downloadedSize / (downloadSpeed * 1000000 / 8); // 理想加载时间(秒)
    const bufferRatio = (idealLoadTime / videoDuration) * 100;
    
    if (DEBUG_MODE) {
      console.log(`视频加载测试 - URL: ${videoUrl}`);
      console.log(`加载时间: ${loadTime.toFixed(2)}ms, 下载速度: ${downloadSpeed.toFixed(2)}Mbps`);
      console.log(`缓冲比率: ${bufferRatio.toFixed(2)}%`);
    }
    
    return {
      success: true,
      loadTime,
      bufferRatio,
      downloadSpeed
    };
  } catch (error) {
    console.error(`视频段加载失败:`, error);
    return {
      success: false,
      loadTime: 0,
      bufferRatio: 0,
      downloadSpeed: 0
    };
  }
};

/**
 * 使用HTML5视频元素测试视频播放能力
 * @param videoUrl 视频URL
 * @returns 视频播放测试结果
 */
const testVideoPlayback = (videoUrl: string): Promise<{
  success: boolean;
  bufferingEvents: number;
  avgBufferingTime: number;
  playbackQuality: number;
}> => {
  return new Promise((resolve) => {
    // 创建隐藏的视频元素
    const video = document.createElement('video');
    video.style.width = '1px';
    video.style.height = '1px';
    video.style.position = 'absolute';
    video.style.opacity = '0.01';
    video.muted = true;
    video.autoplay = false;
    video.preload = 'auto';
    document.body.appendChild(video);
    
    // 初始化监控变量
    let bufferingEvents = 0;
    let bufferingTime = 0;
    let lastBufferingStart = 0;
    let playStartTime = 0;
    let dataLoaded = false;
    
    // 设置超时，最多等待15秒
    const timeout = setTimeout(() => {
      cleanup();
      resolve({
        success: false,
        bufferingEvents: bufferingEvents,
        avgBufferingTime: lastBufferingStart > 0 ? (performance.now() - lastBufferingStart) : 0,
        playbackQuality: 0
      });
    }, 15000);
    
    // 清理函数
    const cleanup = () => {
      clearTimeout(timeout);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
      video.removeEventListener('loadeddata', onDataLoaded);
      video.pause();
      document.body.removeChild(video);
    };
    
    // 缓冲开始事件
    const onWaiting = () => {
      if (!lastBufferingStart) {
        lastBufferingStart = performance.now();
        bufferingEvents++;
      }
    };
    
    // 播放恢复事件
    const onPlaying = () => {
      if (lastBufferingStart > 0) {
        const currentBufferingTime = performance.now() - lastBufferingStart;
        bufferingTime += currentBufferingTime;
        lastBufferingStart = 0;
      }
      
      if (playStartTime === 0) {
        playStartTime = performance.now();
      }
    };
    
    // 错误事件
    const onError = () => {
      cleanup();
      resolve({
        success: false,
        bufferingEvents: bufferingEvents,
        avgBufferingTime: 0,
        playbackQuality: 0
      });
    };
    
    // 视频播放结束
    const onEnded = () => {
      const playDuration = performance.now() - playStartTime;
      const playbackQuality = dataLoaded ? 
        Math.max(0, 100 - (bufferingEvents * 10) - (bufferingTime / playDuration * 100)) : 0;
      
      cleanup();
      resolve({
        success: true,
        bufferingEvents: bufferingEvents,
        avgBufferingTime: bufferingEvents > 0 ? bufferingTime / bufferingEvents : 0,
        playbackQuality: playbackQuality
      });
    };
    
    // 视频数据加载完成
    const onDataLoaded = () => {
      dataLoaded = true;
      
      // 开始播放视频
      video.play().catch(error => {
        console.error('视频播放失败:', error);
        cleanup();
        resolve({
          success: false,
          bufferingEvents: 0,
          avgBufferingTime: 0,
          playbackQuality: 0
        });
      });
      
      // 只播放5秒用于测试
      setTimeout(() => {
        if (!video.ended) {
          onEnded();
        }
      }, 5000);
    };
    
    // 添加事件监听器
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);
    video.addEventListener('loadeddata', onDataLoaded);
    
    // 设置视频源
    video.src = videoUrl;
    video.load();
  });
};

/**
 * 测试流媒体播放能力
 * @param progressCallback 进度回调函数
 * @returns 流媒体测试结果
 */
export const testStreamingCapability = async (
  progressCallback?: (progress: number, stage: string) => void
): Promise<StreamingTestResult> => {
  if (DEBUG_MODE) {
    console.log('开始流媒体播放能力测试');
  }
  
  // 初始化结果
  const result: StreamingTestResult = {
    canStream1080p: false,
    canStream4K: false,
    bufferingIndex: 50, // 默认中等值
    recommendedQuality: '480p',
    testDuration: 0,
    timestamp: Date.now()
  };
  
  // 记录测试开始时间
  const testStartTime = performance.now();
  
  try {
    const loadResults: {resolution: string, downloadSpeed: number, bufferRatio: number, playbackQuality?: number}[] = [];
    let totalDownloadSpeed = 0;
    let highestWorkingResolution = '480p';
    
    // 测试每个视频质量
    for (let i = 0; i < TEST_VIDEOS.length; i++) {
      const video = TEST_VIDEOS[i];
      
      // 更新进度
      if (progressCallback) {
        progressCallback(
          (i / TEST_VIDEOS.length) * 100,
          `测试${video.resolution}视频`
        );
      }
      
      // 加载测试
      const loadResult = await testVideoSegmentLoading(video.url);
      
      if (loadResult.success) {
        // 根据下载速度决定是否尝试播放测试
        if (loadResult.downloadSpeed >= QUALITY_BANDWIDTH_REQUIREMENTS[video.resolution as keyof typeof QUALITY_BANDWIDTH_REQUIREMENTS] * 0.8) {
          if (DEBUG_MODE) {
            console.log(`下载速度足够播放${video.resolution}视频，进行播放测试`);
          }
          
          // 进行播放测试
          const playbackResult = await testVideoPlayback(video.url);
          
          if (playbackResult.success && playbackResult.playbackQuality > 70) {
            highestWorkingResolution = video.resolution;
          }
          
          loadResults.push({
            resolution: video.resolution,
            downloadSpeed: loadResult.downloadSpeed,
            bufferRatio: loadResult.bufferRatio,
            playbackQuality: playbackResult.playbackQuality
          });
        } else {
          loadResults.push({
            resolution: video.resolution,
            downloadSpeed: loadResult.downloadSpeed,
            bufferRatio: loadResult.bufferRatio
          });
        }
        
        totalDownloadSpeed += loadResult.downloadSpeed;
      }
    }
    
    // 更新进度为100%
    if (progressCallback) {
      progressCallback(100, '完成流媒体播放测试');
    }
    
    // 分析测试结果
    if (loadResults.length > 0) {
      // 计算平均下载速度
      const averageDownloadSpeed = totalDownloadSpeed / loadResults.length;
      
      // 根据测试结果确定能够播放的最高分辨率
      result.canStream1080p = highestWorkingResolution === '1080p' || highestWorkingResolution === '4K';
      result.canStream4K = highestWorkingResolution === '4K';
      
      // 确定推荐分辨率
      result.recommendedQuality = highestWorkingResolution;
      
      // 计算缓冲指数（0-100，越低越好）
      let totalBufferRatio = 0;
      let bufferSamples = 0;
      
      loadResults.forEach(res => {
        if (res.resolution === highestWorkingResolution || res.resolution === getNextLowerResolution(highestWorkingResolution)) {
          totalBufferRatio += res.bufferRatio;
          bufferSamples++;
        }
      });
      
      if (bufferSamples > 0) {
        const avgBufferRatio = totalBufferRatio / bufferSamples;
        // 转换为0-100的指数，越低越好
        result.bufferingIndex = Math.min(100, Math.max(0, avgBufferRatio));
      }
    }
    
    // 计算测试持续时间
    result.testDuration = (performance.now() - testStartTime) / 1000;
    
  } catch (error) {
    console.error('流媒体播放测试失败:', error);
  }
  
  if (DEBUG_MODE) {
    console.log('流媒体测试完成，结果:', result);
  }
  
  return result;
};

/**
 * 获取比指定分辨率低一级的分辨率
 */
function getNextLowerResolution(resolution: string): string {
  switch (resolution) {
    case '4K':
      return '1080p';
    case '1080p':
      return '720p';
    case '720p':
      return '480p';
    default:
      return '480p';
  }
}

/**
 * 获取流媒体质量的文字描述
 * @param result 流媒体测试结果
 * @returns 流媒体质量描述
 */
export const getStreamingQualityDescription = (result: StreamingTestResult): string => {
  if (result.canStream4K) {
    return `您的网络可以流畅播放4K超高清视频内容，缓冲可能性低。`;
  } else if (result.canStream1080p) {
    return `您的网络可以流畅播放1080p高清视频内容，但可能无法稳定播放4K超高清视频。`;
  } else if (result.recommendedQuality === '720p') {
    return `您的网络适合播放720p视频内容，播放1080p内容可能会出现轻微缓冲。`;
  } else {
    return `您的网络适合播放${result.recommendedQuality}视频内容，建议降低视频质量以获得流畅体验。`;
  }
}; 