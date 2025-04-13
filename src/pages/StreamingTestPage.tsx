import React, { useState } from 'react';
import { PlayCircle, Video, Film, BarChart2 } from 'lucide-react';
import { testStreamingCapability, getStreamingQualityDescription } from '../services/streamingTest';
import { StreamingTestResult } from '../services/speedTestTypes';

const StreamingTestPage: React.FC = () => {
  // 测试状态
  const [testProgress, setTestProgress] = useState<number>(0);
  const [testStage, setTestStage] = useState<string>('');
  const [testing, setTesting] = useState<boolean>(false);
  
  // 测试结果
  const [streamingResult, setStreamingResult] = useState<StreamingTestResult | null>(null);
  
  // 进度回调函数
  const onProgressUpdate = (progress: number, stage: string) => {
    setTestProgress(progress);
    setTestStage(stage);
  };
  
  // 开始流媒体播放测试
  const runStreamingTest = async () => {
    setTesting(true);
    setStreamingResult(null);
    setTestProgress(0);
    setTestStage('准备测试');
    
    try {
      const result = await testStreamingCapability(onProgressUpdate);
      setStreamingResult(result);
    } catch (error) {
      console.error('流媒体测试失败:', error);
    } finally {
      setTesting(false);
    }
  };
  
  return (
    <div className="flex flex-col space-y-8">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
        流媒体播放能力测试
      </h1>
      <p className="text-center text-gray-600 mb-6">
        测试您的网络是否能流畅播放各种质量的视频内容
      </p>
      
      {/* 说明卡片 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">流媒体能力测试</h2>
        <p className="text-gray-600 mb-4">
          本测试将自动加载和播放不同分辨率的视频片段（480p、720p、1080p和4K），并测量：
        </p>
        <ul className="list-disc pl-5 space-y-1 text-gray-600">
          <li>您的网络下载视频内容的实际速度</li>
          <li>视频缓冲频率和持续时间</li>
          <li>能够流畅播放的最高视频质量</li>
          <li>整体流媒体播放体验的评分</li>
        </ul>
        <div className="mt-4 bg-purple-50 rounded-lg p-3">
          <div className="flex">
            <Film className="h-5 w-5 text-purple-600 mt-0.5 mr-2" />
            <p className="text-sm text-purple-700">
              测试过程中将会播放一些测试用的短视频片段。测试结束后，您将获得网络流媒体播放能力的详细评估。
            </p>
          </div>
        </div>
      </div>
      
      {/* 测试卡片 */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Video className="w-6 h-6 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">流媒体播放能力测试</h3>
          </div>
          <p className="text-gray-600 mb-6">
            本测试将评估您的网络能否流畅播放1080p或4K视频内容，分析缓冲可能性和推荐的最佳清晰度。
            我们通过加载真实视频片段并测量播放性能来评估您的网络表现。
          </p>
          
          {testing ? (
            <div className="space-y-3 mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${testProgress}%` }}></div>
              </div>
              <p className="text-sm text-gray-600">{testStage} ({Math.round(testProgress)}%)</p>
            </div>
          ) : streamingResult ? (
            <div className="space-y-4">
              <div className="flex flex-col space-y-4 p-4 bg-gray-50 rounded-lg">
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
                <div className="flex justify-between">
                  <span className="text-gray-600">测试时间:</span>
                  <span className="font-medium">{streamingResult.testDuration.toFixed(1)}秒</span>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-gray-700 font-medium">{getStreamingQualityDescription(streamingResult)}</p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={runStreamingTest}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <PlayCircle className="w-5 h-5 mr-2" />
                  重新测试
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-purple-800 mb-2">测试内容</h4>
                <ul className="list-disc pl-5 space-y-1 text-purple-700">
                  <li>480p、720p、1080p和4K视频播放能力评估</li>
                  <li>视频加载和缓冲性能分析</li>
                  <li>最佳观看清晰度建议</li>
                  <li>缓冲频率预测和评分</li>
                </ul>
              </div>
              
              <button
                onClick={runStreamingTest}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                开始测试
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* 视频流服务对比 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center mb-4">
          <BarChart2 className="w-5 h-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">主流视频服务带宽需求</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">平台</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">480p</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">720p</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">1080p</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">4K</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">YouTube</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">1.1Mbps</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">2.5Mbps</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">5Mbps</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">20Mbps</td>
              </tr>
              <tr>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">Netflix</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">1.5Mbps</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">3Mbps</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">5Mbps</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">25Mbps</td>
              </tr>
              <tr>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">哔哩哔哩</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">1Mbps</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">2Mbps</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">4Mbps</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">15Mbps</td>
              </tr>
              <tr>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">爱奇艺</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">1Mbps</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">2Mbps</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">4Mbps</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">15Mbps</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 bg-blue-50 p-3 rounded-lg">
          <p className="text-blue-700 text-sm">
            <span className="font-medium">提示：</span> 不同的流媒体平台对带宽有不同的要求。一般来说，
            1080p视频需要至少5-8Mbps的稳定下载速度，而4K内容可能需要25Mbps以上。其他影响流媒体体验的因素
            还包括网络延迟、抖动和稳定性。
          </p>
        </div>
      </div>
    </div>
  );
};

export default StreamingTestPage; 