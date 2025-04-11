import React, { useState, useEffect } from 'react';
import { Download, Upload, Gauge, RefreshCw, Zap, AlertCircle, X, AlertTriangle } from 'lucide-react';
import { runSpeedTest, type SpeedTestResult, SpeedDataPoint } from '../services/speedTest';
import SpeedTestProgress from '../components/SpeedTestProgress';
import SpeedTestHistory from '../components/SpeedTestHistory';

// 本地存储键
const HISTORY_STORAGE_KEY = 'speedtest_history';

const SpeedTestPage: React.FC = () => {
  const [downloadSpeed, setDownloadSpeed] = useState<number | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState<number | null>(null);
  const [ping, setPing] = useState<number | null>(null);
  const [jitter, setJitter] = useState<number | null>(null);
  const [packetLoss, setPacketLoss] = useState<number | null>(null);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 测试阶段、进度和当前测试速度
  const [testStage, setTestStage] = useState<string>('');
  const [testProgress, setTestProgress] = useState<number>(0);
  const [currentSpeed, setCurrentSpeed] = useState<number | undefined>(undefined);
  
  // 下载和上传测试的数据点
  const [downloadDataPoints, setDownloadDataPoints] = useState<SpeedDataPoint[]>([]);
  const [uploadDataPoints, setUploadDataPoints] = useState<SpeedDataPoint[]>([]);
  
  // 历史记录
  const [testHistory, setTestHistory] = useState<SpeedTestResult[]>([]);
  
  // 已完成的测试阶段
  const [completedStages, setCompletedStages] = useState<Set<string>>(new Set());
  
  // 加载历史记录
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (savedHistory) {
        setTestHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('无法加载历史记录:', error);
    }
  }, []);
  
  // 保存历史记录
  const saveTestHistory = (results: SpeedTestResult[]) => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(results));
    } catch (error) {
      console.error('无法保存历史记录:', error);
    }
  };

  // 清除历史记录
  const clearHistory = () => {
    setTestHistory([]);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  };

  // 进度回调函数
  const onProgressUpdate = (stage: string, progress: number, speed?: number, dataPoints?: SpeedDataPoint[]) => {
    setTestStage(stage);
    setTestProgress(progress);
    
    if (speed !== undefined) {
      setCurrentSpeed(speed);
    }
    
    if (dataPoints) {
      if (stage === 'download') {
        setDownloadDataPoints(dataPoints);
      } else if (stage === 'upload') {
        setUploadDataPoints(dataPoints);
      }
    }
  };

  // 阶段完成回调函数
  const onStageComplete = (stageName: string, result: Partial<SpeedTestResult>) => {
    // 更新已完成阶段集合
    setCompletedStages(prev => new Set([...prev, stageName]));
    
    // 根据阶段更新相应数据
    if (stageName === 'ping' && result.ping !== undefined && result.jitter !== undefined) {
      setPing(result.ping);
      setJitter(result.jitter);
    }
    else if (stageName === 'packetLoss' && result.packetLoss !== undefined) {
      setPacketLoss(result.packetLoss);
    }
    else if (stageName === 'download' && result.downloadSpeed !== undefined) {
      setDownloadSpeed(result.downloadSpeed);
      if (result.downloadDataPoints) {
        setDownloadDataPoints(result.downloadDataPoints);
      }
    }
    else if (stageName === 'upload' && result.uploadSpeed !== undefined) {
      setUploadSpeed(result.uploadSpeed);
      if (result.uploadDataPoints) {
        setUploadDataPoints(result.uploadDataPoints);
      }
    }
  };

  // 执行网速测试
  const testSpeed = async () => {
    setTesting(true);
    setDownloadSpeed(null);
    setUploadSpeed(null);
    setPing(null);
    setJitter(null);
    setPacketLoss(null);
    setError(null);
    setDownloadDataPoints([]);
    setUploadDataPoints([]);
    setCompletedStages(new Set());
    
    try {
      // 调用优化后的测速服务
      const result = await runSpeedTest(onProgressUpdate, onStageComplete);
      
      // 添加到历史记录
      const updatedHistory = [result, ...testHistory].slice(0, 10); // 只保留最近10条记录
      setTestHistory(updatedHistory);
      saveTestHistory(updatedHistory);
      
    } catch (error) {
      console.error('测速失败:', error);
      setError('测试过程中出现错误，请稍后重试');
    } finally {
      setTesting(false);
      setTestStage('');
      setTestProgress(0);
      setCurrentSpeed(undefined);
      // 不清空completedStages，保留测试阶段完成的记录
      // setCompletedStages(new Set());
    }
  };

  return (
    <div className="backdrop-blur-sm bg-white/50 rounded-2xl shadow-xl p-8 w-full">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
        网速测试
      </h1>

      {/* 主要测试结果 */}
      <div className="space-y-6 mb-6">
        <div className="bg-white/70 rounded-xl p-6">
          {/* Ping和抖动 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Zap className="w-6 h-6 text-indigo-600" />
              <span className="text-lg font-medium text-gray-700">网络延迟</span>
            </div>
            <div>
              {completedStages.has('ping') && ping === null ? (
                <div className="flex items-center text-red-500">
                  <AlertTriangle className="w-5 h-5 mr-1" />
                  <span className="text-lg font-medium">连接超时</span>
                </div>
              ) : (
                <span className="text-2xl font-bold text-indigo-600">
                  {ping !== null ? `${ping} ms` : '-'}
                </span>
              )}
              {jitter !== null && (
                <span className="text-sm text-gray-500 ml-2">抖动: {jitter} ms</span>
              )}
            </div>
          </div>
          
          {/* 丢包率 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <X className="w-6 h-6 text-purple-600" />
              <span className="text-lg font-medium text-gray-700">丢包率</span>
            </div>
            {completedStages.has('packetLoss') && packetLoss === null ? (
              <div className="flex items-center text-red-500">
                <AlertTriangle className="w-5 h-5 mr-1" />
                <span className="text-lg font-medium">连接超时</span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-purple-600">
                {packetLoss !== null ? `${packetLoss}%` : '-'}
              </span>
            )}
          </div>
          
          {/* 下载速度 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Download className="w-6 h-6 text-blue-600" />
              <span className="text-lg font-medium text-gray-700">下载速度</span>
            </div>
            {downloadSpeed === null && completedStages.has('download') ? (
              <div className="flex items-center text-red-500">
                <AlertTriangle className="w-5 h-5 mr-1" />
                <span className="text-lg font-medium">连接失败</span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-blue-600">
                {downloadSpeed !== null ? `${downloadSpeed} Mbps` : '-'}
              </span>
            )}
          </div>
          
          {/* 上传速度 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Upload className="w-6 h-6 text-green-600" />
              <span className="text-lg font-medium text-gray-700">上传速度</span>
            </div>
            {uploadSpeed === null && completedStages.has('upload') ? (
              <div className="flex items-center text-red-500">
                <AlertTriangle className="w-5 h-5 mr-1" />
                <span className="text-lg font-medium">连接失败</span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-green-600">
                {uploadSpeed !== null ? `${uploadSpeed} Mbps` : '-'}
              </span>
            )}
          </div>
        </div>

        {/* 测试进度 */}
        {testing && (
          <div className="space-y-3">
            <SpeedTestProgress 
              stage={testStage} 
              progress={testProgress} 
              currentSpeed={currentSpeed}
              ping={ping}
              jitter={jitter}
            />
          </div>
        )}
        
        {/* 错误消息 */}
        {error && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* 测试按钮 */}
        <button
          onClick={testSpeed}
          disabled={testing}
          className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-md transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>测试中...</span>
            </>
          ) : (
            <>
              <Gauge className="w-5 h-5" />
              <span>开始测试</span>
            </>
          )}
        </button>
      </div>

      {/* 历史记录 */}
      <SpeedTestHistory 
        results={testHistory} 
        onClearHistory={clearHistory}
      />

      {/* SEO 友好的内容介绍 */}
      <div className="mt-12 space-y-6 text-gray-700">
        <h2 className="text-2xl font-bold text-gray-800">关于网速测试</h2>
        
        <div className="space-y-4">
          <p>
            网速测试是评估您当前互联网连接性能的最佳方式。通过测量下载速度、上传速度、网络延迟（ping值）、抖动和丢包率，我们的测速工具可以全面评估您的网络质量。无论您是在家中使用WiFi、办公室的有线网络，还是使用5G移动网络，这些指标都能帮助您了解您的网络连接是否符合预期。
          </p>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6">为什么测试网速很重要？</h3>
          <p>
            精确的网速测试可以帮助您：
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>确认您是否获得了互联网服务提供商(ISP)承诺的带宽</li>
            <li>诊断视频流、在线游戏或视频会议等应用出现的问题</li>
            <li>了解家中或办公室不同位置的WiFi信号质量</li>
            <li>比较不同时间段的网络性能，识别高峰时段</li>
            <li>在更换路由器或升级网络套餐后评估改进效果</li>
          </ul>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6">如何获得最准确的测试结果</h3>
          <p>
            为获得最准确的网速测试结果，建议：
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>暂停所有大型下载和流媒体应用</li>
            <li>关闭不必要的设备或应用程序占用网络带宽</li>
            <li>尽量使用有线网络连接而非WiFi进行测试</li>
            <li>多次进行测试并取平均值</li>
            <li>在不同时间段测试，了解网络的整体表现</li>
          </ul>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6">我们的测速服务优势</h3>
          <p>
            与其他网络测速工具相比，我们的免费在线网速测试具有以下优势：
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>全面测量：不仅测量速度，还包括网络延迟、抖动和丢包率</li>
            <li>直观界面：清晰展示结果，易于理解</li>
            <li>历史记录：保存测试历史，方便比较不同时间的网络表现</li>
            <li>无需安装：完全基于浏览器，无需下载任何软件</li>
            <li>适用于各种网络：支持测试光纤、DSL、有线、5G、4G等各种网络连接</li>
          </ul>
        </div>
        
        <p className="mt-6 text-sm text-gray-500 text-center">
          注意：实际网速可能因多种因素而异，包括网络拥堵、服务器负载和地理位置等
        </p>
      </div>
    </div>
  );
};

export default SpeedTestPage; 