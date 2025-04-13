import React, { useState } from 'react';
import { PlayCircle, Globe, Clock, Zap, CheckCircle2 } from 'lucide-react';
import { testWebLoading, getWebLoadingAssessment, testCustomUrl } from '../services/webLoadingTest';
import { WebLoadingTestResult } from '../services/speedTestTypes';

const WebLoadingTestPage: React.FC = () => {
  // 网络参数
  const [downloadSpeed, setDownloadSpeed] = useState<number>(50);
  
  // 测试状态
  const [testProgress, setTestProgress] = useState<number>(0);
  const [testStage, setTestStage] = useState<string>('');
  const [testing, setTesting] = useState<boolean>(false);
  
  // 测试结果
  const [webLoadingResult, setWebLoadingResult] = useState<WebLoadingTestResult | null>(null);
  
  // 测试模式
  const [useRealWebsites, setUseRealWebsites] = useState<boolean>(true);
  
  // 自定义URL测试
  const [customUrl, setCustomUrl] = useState<string>('');
  const [customResults, setCustomResults] = useState<{url: string, loadTime: number, fcp: number}[]>([]);
  const [customUrlTesting, setCustomUrlTesting] = useState<boolean>(false);
  
  // 进度回调函数
  const onProgressUpdate = (progress: number, stage: string) => {
    setTestProgress(progress);
    setTestStage(stage);
  };
  
  // 开始网页加载测试
  const runWebLoadingTest = async () => {
    setTesting(true);
    setWebLoadingResult(null);
    setTestProgress(0);
    setTestStage('准备测试');
    
    try {
      const result = await testWebLoading(downloadSpeed, onProgressUpdate, useRealWebsites);
      setWebLoadingResult(result);
    } catch (error) {
      console.error('网页加载测试失败:', error);
    } finally {
      setTesting(false);
    }
  };
  
  // 测试自定义URL的加载时间
  const runCustomUrlTest = async () => {
    if (!customUrl) return;
    
    setCustomUrlTesting(true);
    
    try {
      const result = await testCustomUrl(customUrl);
      
      if (result.success) {
        // 更新结果
        setCustomResults(prev => [
          {
            url: customUrl.startsWith('http') ? customUrl : `https://${customUrl}`, 
            loadTime: result.loadTime, 
            fcp: result.firstContentfulPaint
          }, 
          ...prev.slice(0, 4) // 只保留最近的5个结果
        ]);
      }
    } catch (error) {
      console.error('自定义URL测试失败:', error);
    } finally {
      setCustomUrlTesting(false);
    }
  };
  
  return (
    <div className="flex flex-col space-y-8">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
        网页加载速度测试
      </h1>
      <p className="text-center text-gray-600 mb-6">
        测试不同类型网站的加载速度，评估网页浏览体验
      </p>
      
      {/* 参数设置 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">测试设置</h2>
        <p className="text-sm text-gray-500 mb-4">设置您的下载速度或使用实际测速结果，并选择测试模式</p>
        
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
          
          <div className="flex items-center space-x-4">
            <label className="block text-gray-700 text-sm font-medium">测试模式:</label>
            <div className="flex items-center">
              <input
                type="radio"
                id="real-websites"
                checked={useRealWebsites}
                onChange={() => setUseRealWebsites(true)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <label htmlFor="real-websites" className="ml-2 text-sm text-gray-700">
                真实网站
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="simulated-websites"
                checked={!useRealWebsites}
                onChange={() => setUseRealWebsites(false)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <label htmlFor="simulated-websites" className="ml-2 text-sm text-gray-700">
                模拟测试
              </label>
            </div>
          </div>
        </div>
        
        <div className="mt-4 bg-blue-50 rounded-lg p-3">
          <div className="flex">
            <CheckCircle2 className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              <span className="font-medium">真实网站模式</span> 将测试实际网站的加载性能，
              提供更真实的结果。<span className="font-medium">模拟测试</span> 使用控制环境，
              可能提供更一致的比较基准。
            </p>
          </div>
        </div>
      </div>
      
      {/* 测试卡片 */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Globe className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">网页加载速度测试</h3>
          </div>
          <p className="text-gray-600 mb-6">
            {useRealWebsites 
              ? "本测试将加载真实网站并评估网络的网页浏览性能，包括首次内容显示和完全加载时间。"
              : "本测试将模拟不同类型网站的加载过程，评估网络的网页浏览性能，包括首次内容显示和完全加载时间。"
            }
          </p>
          
          {testing ? (
            <div className="space-y-3 mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${testProgress}%` }}></div>
              </div>
              <p className="text-sm text-gray-600">{testStage} ({Math.round(testProgress)}%)</p>
            </div>
          ) : webLoadingResult ? (
            <div className="space-y-4">
              <div className="flex flex-col space-y-4 p-4 bg-gray-50 rounded-lg">
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
                  <span className="text-gray-600">测试网站:</span>
                  <span className="font-medium">{webLoadingResult.testSites.join(', ')}</span>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-gray-700 font-medium">{getWebLoadingAssessment(webLoadingResult)}</p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={runWebLoadingTest}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlayCircle className="w-5 h-5 mr-2" />
                  重新测试
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-800 mb-2">测试内容</h4>
                <ul className="list-disc pl-5 space-y-1 text-blue-700">
                  {useRealWebsites ? (
                    <>
                      <li>新闻、电商、社交、搜索和视频网站的实际加载性能</li>
                      <li>真实环境中的首次内容绘制时间</li>
                      <li>完整页面加载时间及实际浏览体验评估</li>
                      <li>跨不同网站类型的加载性能分析</li>
                    </>
                  ) : (
                    <>
                      <li>新闻网站、电商网站、社交媒体等不同类型网站的加载性能</li>
                      <li>首次内容绘制时间(影响用户首次看到内容的速度)</li>
                      <li>完全加载时间(页面所有元素完成加载所需时间)</li>
                      <li>网页浏览体验综合评估</li>
                    </>
                  )}
                </ul>
              </div>
              
              <button
                onClick={runWebLoadingTest}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                开始测试
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* 自定义URL测试卡片 */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Clock className="w-6 h-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">自定义网站测试</h3>
          </div>
          <p className="text-gray-600 mb-6">
            输入您想测试的特定网站URL，检测其加载性能。
          </p>
          
          <div className="flex items-center space-x-2 mb-6">
            <input
              type="text"
              placeholder="输入网址 (例如: example.com)"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              onClick={runCustomUrlTest}
              disabled={customUrlTesting || !customUrl}
              className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300"
            >
              {customUrlTesting ? (
                <span>测试中...</span>
              ) : (
                <><Zap className="w-4 h-4 mr-1" />测试</>
              )}
            </button>
          </div>
          
          {customResults.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">网站</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">加载时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">首次内容</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customResults.map((result, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 truncate max-w-[150px]">{result.url}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{(result.loadTime / 1000).toFixed(2)}秒</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{(result.fcp / 1000).toFixed(2)}秒</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* 测试原理解释 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">网页加载测试原理</h3>
        <p className="text-gray-600 mb-4">
          我们通过以下方式评估您的网络加载网页的性能：
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          {useRealWebsites ? (
            <>
              <li>加载多个真实网站并测量其性能指标</li>
              <li>记录首次内容绘制时间(FCP)，这是用户第一次看到页面内容的时间点</li>
              <li>测量页面完全加载的总时间</li>
              <li>分析不同类型网站的加载性能差异</li>
              <li>提供针对您网络的优化建议</li>
            </>
          ) : (
            <>
              <li>模拟加载不同大小和类型的网页资源</li>
              <li>测量首次内容绘制时间(FCP)，这是用户第一次看到页面内容的时间点</li>
              <li>记录页面完全加载的总时间</li>
              <li>分析不同类型网站的加载性能差异</li>
              <li>对真实网站进行直接测试(自定义URL测试)</li>
            </>
          )}
        </ul>
        <div className="mt-4 bg-blue-50 p-3 rounded-lg">
          <p className="text-blue-700 text-sm">
            <span className="font-medium">提示：</span> 良好的网页浏览体验通常要求首次内容显示在1秒内，
            完全加载时间不超过3秒。页面加载速度是网站用户体验和SEO排名的重要因素。
          </p>
        </div>
      </div>
    </div>
  );
};

export default WebLoadingTestPage; 