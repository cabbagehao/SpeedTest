import React, { useState } from 'react';
import { PlayCircle, Video, Users, Mic, Camera } from 'lucide-react';
import { testVideoConferenceQuality, getVideoConferenceAssessment } from '../services/videoConferenceTest';
import { VideoConferenceTestResult } from '../services/speedTestTypes';

const VideoConferenceTestPage: React.FC = () => {
  // 网络参数
  const [downloadSpeed, setDownloadSpeed] = useState<number>(50);
  const [uploadSpeed, setUploadSpeed] = useState<number>(10);
  const [ping, setPing] = useState<number>(30);
  const [jitter, setJitter] = useState<number>(10);
  const [packetLoss, setPacketLoss] = useState<number>(0.5);
  
  // 测试状态
  const [testProgress, setTestProgress] = useState<number>(0);
  const [testStage, setTestStage] = useState<string>('');
  const [testing, setTesting] = useState<boolean>(false);
  
  // 测试结果
  const [videoConferenceResult, setVideoConferenceResult] = useState<VideoConferenceTestResult | null>(null);
  
  // 进度回调函数
  const onProgressUpdate = (progress: number, stage: string) => {
    setTestProgress(progress);
    setTestStage(stage);
  };
  
  // 开始视频会议测试
  const runVideoConferenceTest = async () => {
    setTesting(true);
    setVideoConferenceResult(null);
    setTestProgress(0);
    setTestStage('准备测试');
    
    try {
      const result = await testVideoConferenceQuality(
        uploadSpeed,
        downloadSpeed,
        ping,
        jitter,
        packetLoss,
        onProgressUpdate
      );
      setVideoConferenceResult(result);
    } catch (error) {
      console.error('视频会议质量测试失败:', error);
    } finally {
      setTesting(false);
    }
  };
  
  // 获取等级评分样式
  const getScoreStyle = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // 获取推荐人数样式
  const getParticipantsStyle = (count: number) => {
    if (count >= 8) return 'text-green-600';
    if (count >= 4) return 'text-blue-600';
    if (count >= 2) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <div className="flex flex-col space-y-8">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
        视频会议质量测试
      </h1>
      <p className="text-center text-gray-600 mb-6">
        测试您的网络是否适合视频会议，评估音视频质量和稳定性
      </p>
      
      {/* 参数设置 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">网络参数设置</h2>
        <p className="text-sm text-gray-500 mb-4">设置您的网络参数或使用实际测速结果，以获得更准确的视频会议质量测试</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">下载速度 (Mbps)</label>
            <input 
              type="number" 
              min="0.1" 
              step="0.1"
              value={downloadSpeed}
              onChange={(e) => setDownloadSpeed(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">上传速度 (Mbps)</label>
            <input 
              type="number" 
              min="0.1" 
              step="0.1"
              value={uploadSpeed}
              onChange={(e) => setUploadSpeed(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">延迟 (ms)</label>
            <input 
              type="number" 
              min="1" 
              step="1"
              value={ping}
              onChange={(e) => setPing(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">抖动 (ms)</label>
            <input 
              type="number" 
              min="0" 
              step="1"
              value={jitter}
              onChange={(e) => setJitter(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">丢包率 (%)</label>
            <input 
              type="number" 
              min="0" 
              max="100" 
              step="0.1"
              value={packetLoss}
              onChange={(e) => setPacketLoss(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>
      
      {/* 会议平台需求信息 */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Users className="w-6 h-6 text-indigo-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">常见视频会议平台带宽需求</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">平台</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">1:1通话</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">群组通话</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">高清视频</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">Zoom</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">上传/下载: 0.6Mbps</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">上传/下载: 1.0Mbps</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">上传/下载: 3.0Mbps</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">微软Teams</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">上传/下载: 0.5Mbps</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">上传/下载: 1.2Mbps</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">上传/下载: 2.5Mbps</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">Google Meet</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">上传/下载: 0.5Mbps</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">上传/下载: 1.0Mbps</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">上传/下载: 3.2Mbps</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* 测试卡片 */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Video className="w-6 h-6 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">视频会议质量测试</h3>
          </div>
          <p className="text-gray-600 mb-6">
            本测试将评估您的网络对视频会议的适用性，分析音视频质量、连接稳定性以及网络支持的最大参与人数。
          </p>
          
          {testing ? (
            <div className="space-y-3 mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${testProgress}%` }}></div>
              </div>
              <p className="text-sm text-gray-600">{testStage} ({Math.round(testProgress)}%)</p>
            </div>
          ) : videoConferenceResult ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <Camera className="w-5 h-5 text-indigo-600 mr-2" />
                    <h4 className="font-medium text-gray-700">视频质量</h4>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full border-8 border-gray-200 flex items-center justify-center relative">
                      <div className={`text-3xl font-bold ${getScoreStyle(videoConferenceResult.videoQualityScore)}`}>
                        {videoConferenceResult.videoQualityScore}
                      </div>
                      <div className="text-sm text-gray-500 absolute -bottom-1">分</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <Mic className="w-5 h-5 text-indigo-600 mr-2" />
                    <h4 className="font-medium text-gray-700">音频质量</h4>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full border-8 border-gray-200 flex items-center justify-center relative">
                      <div className={`text-3xl font-bold ${getScoreStyle(videoConferenceResult.audioQualityScore)}`}>
                        {videoConferenceResult.audioQualityScore}
                      </div>
                      <div className="text-sm text-gray-500 absolute -bottom-1">分</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">连接稳定性:</span>
                  <span className={`font-medium ${getScoreStyle(videoConferenceResult.stability)}`}>
                    {videoConferenceResult.stability}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                  <div 
                    className={`h-2.5 rounded-full ${videoConferenceResult.stability > 80 ? 'bg-green-500' : 
                      videoConferenceResult.stability > 60 ? 'bg-blue-500' : 
                      videoConferenceResult.stability > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                    style={{ width: `${videoConferenceResult.stability}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-indigo-600 mr-2" />
                    <span className="text-gray-600">推荐参与人数:</span>
                  </div>
                  <span className={`font-bold text-xl ${getParticipantsStyle(videoConferenceResult.recommendedParticipants)}`}>
                    {videoConferenceResult.recommendedParticipants} 人
                  </span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <p className="text-gray-700 font-medium">{getVideoConferenceAssessment(videoConferenceResult)}</p>
              </div>

              <div className="mt-6">
                <button
                  onClick={runVideoConferenceTest}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <PlayCircle className="w-5 h-5 mr-2" />
                  重新测试
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="bg-indigo-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-indigo-800 mb-2">测试内容</h4>
                <ul className="list-disc pl-5 space-y-1 text-indigo-700">
                  <li>网络参数对视频通话质量的影响评估</li>
                  <li>音频流畅度和清晰度分析</li>
                  <li>视频分辨率和流畅度评估</li>
                  <li>连接稳定性和可靠性分析</li>
                  <li>最大参与人数推荐</li>
                </ul>
              </div>
              
              <button
                onClick={runVideoConferenceTest}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                开始测试
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* 视频会议优化指南 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">视频会议质量优化指南</h3>
        <p className="text-gray-600 mb-4">
          您可以通过以下方式提高视频会议质量：
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>尽可能使用有线网络连接，而不是WiFi</li>
          <li>关闭不必要的后台应用和下载，以节省带宽</li>
          <li>确保您的设备靠近WiFi路由器（如果使用无线连接）</li>
          <li>在高峰时段避免带宽密集型活动（如在线游戏、4K流媒体等）</li>
          <li>如果网络受限，可以关闭自己的视频，仅保留音频</li>
          <li>尝试降低视频质量设置（在会议软件中）</li>
        </ul>
        <div className="mt-4 bg-blue-50 p-3 rounded-lg">
          <p className="text-blue-700 text-sm">
            <span className="font-medium">提示：</span> 上传速度对视频会议质量影响很大，
            如果您需要频繁参与视频会议，请考虑选择上传带宽更高的网络套餐。
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoConferenceTestPage; 