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
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
        网速测试
      </h1>

      {/* 主要测试结果 */}
      <div className="space-y-6 mb-6">
        <div className="bg-gray-50 rounded-xl p-6">
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

      <p className="mt-6 text-sm text-gray-500 text-center">
        注意：实际网速可能因多种因素而异，包括网络拥堵、服务器负载和地理位置等
      </p>
    </div>
  );
};

export default SpeedTestPage; 