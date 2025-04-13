import React, { useState } from 'react';
import { PlayCircle, Video, Globe, Gamepad2, Video as VideoIcon } from 'lucide-react';
import { testStreamingCapability, getStreamingQualityDescription } from '../services/streamingTest';
import { testWebLoading, getWebLoadingAssessment } from '../services/webLoadingTest';
import { testGameLatency, getGameLatencyAssessment } from '../services/gameLatencyTest';
import { testVideoConferenceQuality, getVideoConferenceAssessment } from '../services/videoConferenceTest';
import { StreamingTestResult, WebLoadingTestResult, GameLatencyTestResult, VideoConferenceTestResult } from '../services/speedTestTypes';

// 定义测试类型
type TestType = 'streaming' | 'webLoading' | 'gameLatency' | 'videoConference';

// 高级测试页面
const AdvancedTestPage: React.FC = () => {
  // 网络速度参数
  const [downloadSpeed, setDownloadSpeed] = useState<number>(50);
  const [uploadSpeed, setUploadSpeed] = useState<number>(10);
  const [ping, setPing] = useState<number>(30);
  const [jitter, setJitter] = useState<number>(10);
  const [packetLoss, setPacketLoss] = useState<number>(0.5);
  
  // 测试状态
  const [activeTest, setActiveTest] = useState<TestType | null>(null);
  const [testProgress, setTestProgress] = useState<number>(0);
  const [testStage, setTestStage] = useState<string>('');
  const [testing, setTesting] = useState<boolean>(false);
  
  // 测试结果
  const [streamingResult, setStreamingResult] = useState<StreamingTestResult | null>(null);
  const [webLoadingResult, setWebLoadingResult] = useState<WebLoadingTestResult | null>(null);
  const [gameLatencyResult, setGameLatencyResult] = useState<GameLatencyTestResult | null>(null);
  const [videoConferenceResult, setVideoConferenceResult] = useState<VideoConferenceTestResult | null>(null);
  
  // 游戏类型选择
  const [selectedGameType, setSelectedGameType] = useState<'FPS' | 'MOBA' | 'MMO' | 'CASUAL'>('FPS');
  
  // 进度回调函数
  const onProgressUpdate = (progress: number, stage: string) => {
    setTestProgress(progress);
    setTestStage(stage);
  };
  
  // 开始流媒体播放测试
  const runStreamingTest = async () => {
    setActiveTest('streaming');
    setTesting(true);
    setStreamingResult(null);
    setTestProgress(0);
    setTestStage('准备测试');
    
    try {
      const result = await testStreamingCapability(downloadSpeed, onProgressUpdate);
      setStreamingResult(result);
    } catch (error) {
      console.error('流媒体测试失败:', error);
    } finally {
      setTesting(false);
    }
  };
  
  // 开始网页加载测试
  const runWebLoadingTest = async () => {
    setActiveTest('webLoading');
    setTesting(true);
    setWebLoadingResult(null);
    setTestProgress(0);
    setTestStage('准备测试');
    
    try {
      const result = await testWebLoading(downloadSpeed, onProgressUpdate);
      setWebLoadingResult(result);
    } catch (error) {
      console.error('网页加载测试失败:', error);
    } finally {
      setTesting(false);
    }
  };
  
  // 开始游戏延迟测试
  const runGameLatencyTest = async () => {
    setActiveTest('gameLatency');
    setTesting(true);
    setGameLatencyResult(null);
    setTestProgress(0);
    setTestStage('准备测试');
    
    try {
      const result = await testGameLatency(ping, onProgressUpdate);
      setGameLatencyResult(result);
    } catch (error) {
      console.error('游戏延迟测试失败:', error);
    } finally {
      setTesting(false);
    }
  };
  
  // 开始视频会议质量测试
  const runVideoConferenceTest = async () => {
    setActiveTest('videoConference');
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
  
  return (
    <div className="flex flex-col space-y-8">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
        高级网络测试
      </h1>
      <p className="text-center text-gray-600 mb-6">
        测试您的网络在特定场景下的实际表现能力
      </p>
      
      {/* 网络参数设置 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">网络参数设置</h2>
        <p className="text-sm text-gray-500 mb-4">设置您的网络参数或使用实际测速结果，以获得更准确的高级测试</p>
        
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
          
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">游戏类型</label>
            <select
              value={selectedGameType}
              onChange={(e) => setSelectedGameType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="FPS">射击游戏 (FPS)</option>
              <option value="MOBA">多人在线竞技 (MOBA)</option>
              <option value="MMO">大型多人在线 (MMO)</option>
              <option value="CASUAL">休闲游戏</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* 测试卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 流媒体测试卡片 */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Video className="w-6 h-6 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">流媒体播放能力测试</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">测试您的网络能否流畅播放1080p或4K视频内容，评估可能的缓冲问题</p>
            
            {activeTest === 'streaming' && testing ? (
              <div className="space-y-3">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${testProgress}%` }}></div>
                </div>
                <p className="text-sm text-gray-600">{testStage} ({Math.round(testProgress)}%)</p>
              </div>
            ) : streamingResult ? (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-600">1080p视频:</span>
                  <span className={`font-medium ${streamingResult.canStream1080p ? 'text-green-600' : 'text-red-600'}`}>
                    {streamingResult.canStream1080p ? '可流畅播放' : '可能卡顿'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">4K视频:</span>
                  <span className={`font-medium ${streamingResult.canStream4K ? 'text-green-600' : 'text-red-600'}`}>
                    {streamingResult.canStream4K ? '可流畅播放' : '不建议'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">推荐清晰度:</span>
                  <span className="font-medium">{streamingResult.recommendedQuality}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">缓冲评分:</span>
                  <span className={`font-medium ${streamingResult.bufferingIndex < 30 ? 'text-green-600' : 
                    streamingResult.bufferingIndex < 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {100 - streamingResult.bufferingIndex}/100
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-gray-700 font-medium">{getStreamingQualityDescription(streamingResult)}</p>
                </div>
              </div>
            ) : (
              <button
                onClick={runStreamingTest}
                disabled={testing}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                开始测试
              </button>
            )}
          </div>
        </div>
        
        {/* 网页加载测试卡片 */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Globe className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">网页加载速度测试</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">测试不同类型网站的加载速度，评估首次内容绘制和完全加载时间</p>
            
            {activeTest === 'webLoading' && testing ? (
              <div className="space-y-3">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${testProgress}%` }}></div>
                </div>
                <p className="text-sm text-gray-600">{testStage} ({Math.round(testProgress)}%)</p>
              </div>
            ) : webLoadingResult ? (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-600">平均加载时间:</span>
                  <span className="font-medium">
                    {(webLoadingResult.averageLoadTime / 1000).toFixed(2)} 秒
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">首次内容显示:</span>
                  <span className="font-medium">
                    {(webLoadingResult.firstContentfulPaint / 1000).toFixed(2)} 秒
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">完全加载时间:</span>
                  <span className="font-medium">
                    {(webLoadingResult.fullLoadTime / 1000).toFixed(2)} 秒
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">测试网站类型:</span>
                  <span className="font-medium">{webLoadingResult.testSites.join(', ')}</span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-gray-700 font-medium">{getWebLoadingAssessment(webLoadingResult)}</p>
                </div>
              </div>
            ) : (
              <button
                onClick={runWebLoadingTest}
                disabled={testing}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                开始测试
              </button>
            )}
          </div>
        </div>
        
        {/* 游戏延迟测试卡片 */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Gamepad2 className="w-6 h-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">游戏延迟测试</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">测试您的网络在游戏中的延迟表现，评估不同游戏类型的适用性</p>
            
            {activeTest === 'gameLatency' && testing ? (
              <div className="space-y-3">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${testProgress}%` }}></div>
                </div>
                <p className="text-sm text-gray-600">{testStage} ({Math.round(testProgress)}%)</p>
              </div>
            ) : gameLatencyResult ? (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-600">平均延迟:</span>
                  <span className="font-medium">
                    {Math.round(gameLatencyResult.averagePing)} ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">抖动:</span>
                  <span className="font-medium">
                    {Math.round(gameLatencyResult.jitter)} ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">丢包率:</span>
                  <span className="font-medium">
                    {gameLatencyResult.packetLoss}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">网络稳定性:</span>
                  <span className={`font-medium ${gameLatencyResult.stability > 70 ? 'text-green-600' : 
                    gameLatencyResult.stability > 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {gameLatencyResult.stability}/100
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-gray-700 font-medium">{getGameLatencyAssessment(gameLatencyResult, selectedGameType)}</p>
                </div>
              </div>
            ) : (
              <button
                onClick={runGameLatencyTest}
                disabled={testing}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                开始测试
              </button>
            )}
          </div>
        </div>
        
        {/* 视频会议质量测试卡片 */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <VideoIcon className="w-6 h-6 text-indigo-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">视频会议质量测试</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">评估您的网络对于视频会议的适用性，包括音视频质量和稳定性</p>
            
            {activeTest === 'videoConference' && testing ? (
              <div className="space-y-3">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${testProgress}%` }}></div>
                </div>
                <p className="text-sm text-gray-600">{testStage} ({Math.round(testProgress)}%)</p>
              </div>
            ) : videoConferenceResult ? (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-600">视频质量:</span>
                  <span className={`font-medium ${videoConferenceResult.videoQualityScore > 70 ? 'text-green-600' : 
                    videoConferenceResult.videoQualityScore > 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {videoConferenceResult.videoQualityScore}/100
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">音频质量:</span>
                  <span className={`font-medium ${videoConferenceResult.audioQualityScore > 70 ? 'text-green-600' : 
                    videoConferenceResult.audioQualityScore > 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {videoConferenceResult.audioQualityScore}/100
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">连接稳定性:</span>
                  <span className={`font-medium ${videoConferenceResult.stability > 70 ? 'text-green-600' : 
                    videoConferenceResult.stability > 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {videoConferenceResult.stability}/100
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">推荐参与人数:</span>
                  <span className="font-medium">
                    {videoConferenceResult.recommendedParticipants} 人
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-gray-700 font-medium">{getVideoConferenceAssessment(videoConferenceResult)}</p>
                </div>
              </div>
            ) : (
              <button
                onClick={runVideoConferenceTest}
                disabled={testing}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                开始测试
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* 提示信息 */}
      <div className="bg-blue-50 text-blue-700 p-4 rounded-lg text-sm">
        <p className="font-medium mb-1">提示信息</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>这些测试基于您输入的网络参数或实际测速结果进行模拟评估</li>
          <li>实际使用体验可能会受到多种因素影响，包括网络波动和服务器状况</li>
          <li>建议先运行标准网速测试获取准确的网络参数</li>
          <li>对于游戏延迟测试，可以选择不同游戏类型获得更精准的评估</li>
        </ul>
      </div>
    </div>
  );
};

export default AdvancedTestPage; 