import React, { useState, useEffect } from 'react';
import { Activity, FileDown, FileUp, Clock, Globe, BarChart2 } from 'lucide-react';
import { testWebLoadingSpeed } from '../services/webLoadingTest';
import { testGameLatency } from '../services/gameLatencyTest';
import { SpeedTestResult } from '../services/speedTestTypes';

// 测试状态类型
interface TestState {
  webLoadingTested: boolean;
  gameLatencyTested: boolean;
  webLoadingScore: number;
  gameLatencyScore: number;
  speedScore: number;
  overallScore: number;
}

// 高级测试页面
const AdvancedTestPage: React.FC = () => {
  // 测试状态
  const [testing, setTesting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [testStage, setTestStage] = useState<string>('');
  
  // 已保存的常规测速结果
  const [savedSpeedResult, setSavedSpeedResult] = useState<SpeedTestResult | null>(null);
  
  // 网页加载和游戏延迟测试结果
  const [webLoadingResult, setWebLoadingResult] = useState<any | null>(null);
  const [gameLatencyResult, setGameLatencyResult] = useState<any | null>(null);
  
  // 整体测试状态
  const [testState, setTestState] = useState<TestState>({
    webLoadingTested: false,
    gameLatencyTested: false,
    webLoadingScore: 0,
    gameLatencyScore: 0,
    speedScore: 0,
    overallScore: 0
  });
  
  // 进度更新回调
  const onProgressUpdate = (progress: number, stage: string) => {
    setProgress(progress);
    setTestStage(stage);
  };
  
  // 进度更新间隔
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (testing && progress < 100) {
      timer = setTimeout(() => {
        const increment = Math.random() * 2;
        if (progress + increment < 100) {
          setProgress(prev => prev + increment);
        }
      }, 200);
    }
    
    return () => clearTimeout(timer);
  }, [testing, progress]);
  
  // 加载已保存的测速结果
  useEffect(() => {
    const savedResult = localStorage.getItem('speedTestResult');
    if (savedResult) {
      try {
        const parsed = JSON.parse(savedResult);
        if (parsed && parsed.downloadSpeed) {
          setSavedSpeedResult(parsed);
          
          // 计算速度得分
          const downloadScore = Math.min(100, parsed.downloadSpeed * 4);
          const uploadScore = Math.min(100, parsed.uploadSpeed * 8);
          const pingScore = Math.max(0, 100 - parsed.ping);
          
          const speedScore = Math.round((downloadScore * 0.4) + (uploadScore * 0.3) + (pingScore * 0.3));
          
          setTestState(prev => ({
            ...prev,
            speedScore
          }));
        }
      } catch (e) {
        console.error('解析保存的测速结果失败:', e);
      }
    }
  }, []);
  
  // 开始网页加载速度测试
  const runWebLoadingTest = async () => {
    setTesting(true);
    setTestStage('开始网页加载测试');
    
    try {
      const result = await testWebLoadingSpeed(onProgressUpdate);
      setWebLoadingResult(result);
      
      // 计算网页加载得分
      const loadTimeScore = Math.max(0, 100 - (result.avgLoadTime / 100));
      const ttfbScore = Math.max(0, 100 - (result.avgTTFB / 20));
      const webLoadingScore = Math.round((loadTimeScore * 0.7) + (ttfbScore * 0.3));
      
      setTestState(prev => ({
        ...prev,
        webLoadingTested: true,
        webLoadingScore
      }));
    } catch (error) {
      console.error('网页加载测试失败:', error);
    } finally {
      setTesting(false);
      updateOverallScore();
    }
  };
  
  // 开始游戏延迟测试
  const runGameLatencyTest = async () => {
    setTesting(true);
    setTestStage('开始游戏延迟测试');
    
    try {
      const result = await testGameLatency(onProgressUpdate);
      setGameLatencyResult(result);
      
      // 计算游戏延迟得分
      const pingScore = Math.max(0, 100 - (result.avgPing / 2));
      const jitterScore = Math.max(0, 100 - (result.jitter * 5));
      const packetLossScore = Math.max(0, 100 - (result.packetLoss * 20));
      
      const gameLatencyScore = Math.round((pingScore * 0.5) + (jitterScore * 0.3) + (packetLossScore * 0.2));
      
      setTestState(prev => ({
        ...prev,
        gameLatencyTested: true,
        gameLatencyScore
      }));
    } catch (error) {
      console.error('游戏延迟测试失败:', error);
    } finally {
      setTesting(false);
      updateOverallScore();
    }
  };
  
  // 更新总体得分
  const updateOverallScore = () => {
    // 计算总分 - 根据已完成的测试计算
    const completedTests = [
      testState.speedScore > 0 ? 1 : 0,
      testState.webLoadingTested ? 1 : 0,
      testState.gameLatencyTested ? 1 : 0
    ].reduce((a, b) => a + b, 0);
    
    if (completedTests > 0) {
      const totalScore = (
        (testState.speedScore > 0 ? testState.speedScore : 0) +
        (testState.webLoadingTested ? testState.webLoadingScore : 0) +
        (testState.gameLatencyTested ? testState.gameLatencyScore : 0)
      ) / completedTests;
      
      setTestState(prev => ({
        ...prev,
        overallScore: Math.round(totalScore)
      }));
    }
  };
  
  // 获取分数样式
  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <div className="flex flex-col space-y-8">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
        高级网络测试
      </h1>
      <p className="text-center text-gray-600 mb-6">
        综合评测您的网络性能，包括网页加载、游戏延迟和整体体验分析
      </p>
      
      {/* 介绍卡片 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">高级网络性能评测</h2>
        <p className="text-gray-600 mb-4">
          本测试将评估您的网络在不同场景下的表现，提供全面的分析和优化建议：
        </p>
        <ul className="list-disc pl-5 space-y-1 text-gray-600 mb-4">
          <li>网页加载测试 - 评估在各类网站上的浏览体验</li>
          <li>游戏延迟测试 - 分析网络在游戏中的表现</li>
        </ul>
        <div className="mt-4 bg-indigo-50 rounded-lg p-3">
          <div className="flex">
            <Activity className="h-5 w-5 text-indigo-600 mt-0.5 mr-2" />
            <p className="text-sm text-indigo-700">
              如果您已经完成了基本网速测试，系统将自动使用这些结果进行综合评分。建议先进行基本网速测试以获得更全面的分析。
            </p>
          </div>
        </div>
      </div>
      
      {/* 测试分数概览 */}
      {testState.overallScore > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">网络测试分数</h3>
            <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
              {/* 总分 */}
              <div className="flex-1 border rounded-xl p-4 bg-indigo-50">
                <div className="text-center">
                  <p className="text-indigo-800 font-medium mb-1">总体评分</p>
                  <div className={`text-4xl font-bold ${getScoreColorClass(testState.overallScore)}`}>
                    {testState.overallScore}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">满分100</p>
                </div>
              </div>
              
              {/* 网速分数 */}
              {testState.speedScore > 0 && (
                <div className="flex-1 border rounded-xl p-4">
                  <div className="text-center">
                    <p className="text-gray-600 font-medium mb-1">网速分数</p>
                    <div className={`text-2xl font-bold ${getScoreColorClass(testState.speedScore)}`}>
                      {testState.speedScore}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">下载/上传/延迟</p>
                  </div>
                </div>
              )}
              
              {/* 网页加载分数 */}
              {testState.webLoadingTested && (
                <div className="flex-1 border rounded-xl p-4">
                  <div className="text-center">
                    <p className="text-gray-600 font-medium mb-1">网页加载</p>
                    <div className={`text-2xl font-bold ${getScoreColorClass(testState.webLoadingScore)}`}>
                      {testState.webLoadingScore}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">加载时间/响应速度</p>
                  </div>
                </div>
              )}
              
              {/* 游戏延迟分数 */}
              {testState.gameLatencyTested && (
                <div className="flex-1 border rounded-xl p-4">
                  <div className="text-center">
                    <p className="text-gray-600 font-medium mb-1">游戏延迟</p>
                    <div className={`text-2xl font-bold ${getScoreColorClass(testState.gameLatencyScore)}`}>
                      {testState.gameLatencyScore}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">延迟/抖动/丢包</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* 评估结果 */}
            <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <p className="text-gray-700">
                {testState.overallScore >= 80 ? (
                  <span>您的网络性能<strong className="text-green-600">优秀</strong>，适合几乎所有网络应用，包括4K流媒体和在线游戏。</span>
                ) : testState.overallScore >= 60 ? (
                  <span>您的网络性能<strong className="text-yellow-600">良好</strong>，适合大多数应用，但4K流媒体或大型游戏可能会有轻微延迟。</span>
                ) : (
                  <span>您的网络性能<strong className="text-red-600">较差</strong>，建议优化网络设置或联系服务提供商提升带宽。</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* 网页加载测试卡片 */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Globe className="w-6 h-6 text-indigo-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">网页加载测试</h3>
          </div>
          
          <p className="text-gray-600 text-sm mb-4">评估您的网络加载各类网站的速度和响应能力</p>
          
          {testing && testStage.includes('网页加载') ? (
            <div className="space-y-2 mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-sm text-gray-600">{testStage} ({Math.round(progress)}%)</p>
            </div>
          ) : webLoadingResult ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-600 font-medium">平均加载时间</p>
                    <p className="font-bold text-indigo-600">{webLoadingResult.avgLoadTime.toFixed(0)} ms</p>
                  </div>
                  <p className="text-xs text-gray-500">网页完全加载所需的平均时间</p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-600 font-medium">首字节时间</p>
                    <p className="font-bold text-indigo-600">{webLoadingResult.avgTTFB.toFixed(0)} ms</p>
                  </div>
                  <p className="text-xs text-gray-500">首次接收到服务器响应的平均时间</p>
                </div>
              </div>
              
              <div className="mt-3">
                <h4 className="font-medium text-gray-700 mb-2">测试的网站</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {webLoadingResult.sites.map((site: string, index: number) => (
                    <div key={index} className="border rounded-md p-2 text-center text-sm text-gray-600">
                      {site}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                <p className="text-gray-700">
                  {webLoadingResult.avgLoadTime < 1000 ? '您的网页加载速度非常快，浏览体验优秀！' :
                   webLoadingResult.avgLoadTime < 2500 ? '您的网页加载速度良好，大多数网站加载流畅。' :
                   '您的网页加载速度偏慢，浏览体验可能不够理想。'}
                </p>
              </div>
            </div>
          ) : (
            <button 
              onClick={runWebLoadingTest}
              disabled={testing}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            >
              开始网页加载测试
            </button>
          )}
        </div>
      </div>
      
      {/* 游戏延迟测试卡片 */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Clock className="w-6 h-6 text-indigo-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">游戏延迟测试</h3>
          </div>
          
          <p className="text-gray-600 text-sm mb-4">评估您的网络在游戏中的响应速度和稳定性</p>
          
          {testing && testStage.includes('游戏延迟') ? (
            <div className="space-y-2 mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-sm text-gray-600">{testStage} ({Math.round(progress)}%)</p>
            </div>
          ) : gameLatencyResult ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-600 font-medium">平均延迟</p>
                    <p className="font-bold text-indigo-600">{gameLatencyResult.avgPing.toFixed(1)} ms</p>
                  </div>
                  <p className="text-xs text-gray-500">游戏服务器响应时间</p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-600 font-medium">抖动</p>
                    <p className="font-bold text-indigo-600">{gameLatencyResult.jitter.toFixed(1)} ms</p>
                  </div>
                  <p className="text-xs text-gray-500">延迟的变化幅度，越小越稳定</p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-600 font-medium">丢包率</p>
                    <p className="font-bold text-indigo-600">{gameLatencyResult.packetLoss.toFixed(1)}%</p>
                  </div>
                  <p className="text-xs text-gray-500">数据包丢失的百分比</p>
                </div>
              </div>
              
              <div className="mt-3">
                <h4 className="font-medium text-gray-700 mb-2">测试的游戏服务器</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {gameLatencyResult.servers.map((server: string, index: number) => (
                    <div key={index} className="border rounded-md p-2 text-center text-sm text-gray-600">
                      {server}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                <p className="text-gray-700">
                  {gameLatencyResult.avgPing < 50 && gameLatencyResult.jitter < 10 ? 
                    '您的网络非常适合竞技游戏，延迟低且稳定！' :
                   gameLatencyResult.avgPing < 100 && gameLatencyResult.jitter < 20 ? 
                    '您的网络适合大多数游戏，但可能在竞技游戏中略有延迟。' :
                    '您的网络延迟较高，可能会影响游戏体验，尤其是快节奏游戏。'}
                </p>
              </div>
            </div>
          ) : (
            <button 
              onClick={runGameLatencyTest}
              disabled={testing}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            >
              开始游戏延迟测试
            </button>
          )}
        </div>
      </div>
      
      {/* 网络优化建议 */}
      {(testState.webLoadingTested || testState.gameLatencyTested) && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <BarChart2 className="w-6 h-6 text-indigo-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">网络优化建议</h3>
            </div>
            
            <div className="space-y-4">
              {testState.webLoadingTested && webLoadingResult.avgLoadTime > 2000 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-1">提升网页浏览体验</h4>
                  <ul className="list-disc pl-5 text-sm text-blue-800">
                    <li>考虑使用带有广告拦截功能的浏览器或扩展</li>
                    <li>启用浏览器的预加载功能</li>
                    <li>使用DNS加速服务，如Cloudflare的1.1.1.1或Google DNS</li>
                  </ul>
                </div>
              )}
              
              {testState.gameLatencyTested && gameLatencyResult.avgPing > 80 && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-1">降低游戏延迟</h4>
                  <ul className="list-disc pl-5 text-sm text-green-800">
                    <li>尽可能使用有线连接而非WiFi</li>
                    <li>关闭后台下载和其他占用带宽的应用</li>
                    <li>选择地理位置更近的游戏服务器</li>
                    <li>使用游戏优化路由服务或软件</li>
                  </ul>
                </div>
              )}
              
              <div className="p-3 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-800 mb-1">通用网络优化方法</h4>
                <ul className="list-disc pl-5 text-sm text-purple-800">
                  <li>定期重启路由器和调制解调器（每1-2周一次）</li>
                  <li>确保路由器固件是最新版本</li>
                  <li>减少同时连接到WiFi的设备数量</li>
                  <li>将路由器放置在家中的中心位置，远离干扰源</li>
                  <li>联系您的网络服务提供商排查线路问题</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedTestPage; 