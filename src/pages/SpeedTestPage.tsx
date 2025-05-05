import React, { useState, useEffect, useRef } from 'react';
import { Download, Upload, Gauge, RefreshCw, Zap, AlertCircle, X, AlertTriangle, Info, Activity, Wifi, ChevronsUp, BarChart3 } from 'lucide-react';
import { runSpeedTest, type SpeedTestResult, SpeedDataPoint } from '../services';
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
  // 添加测试完成状态
  const [testCompleted, setTestCompleted] = useState<boolean>(false);

  // 下载和上传测试的数据点 - 仍然保留，但不在UI上显示
  const [downloadDataPoints, setDownloadDataPoints] = useState<SpeedDataPoint[]>([]);
  const [uploadDataPoints, setUploadDataPoints] = useState<SpeedDataPoint[]>([]);

  // 历史记录
  const [testHistory, setTestHistory] = useState<SpeedTestResult[]>([]);
  const [historyExpanded, setHistoryExpanded] = useState(false);

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
    // 重置测试完成状态
    setTestCompleted(false);

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

    // 清空进度条 - 重置测试阶段和进度
    setTestStage('');
    setTestProgress(0);
    setCurrentSpeed(undefined);

    try {
      // 调用优化后的测速服务
      const result = await runSpeedTest(onProgressUpdate, onStageComplete);

      // 添加到历史记录
      const updatedHistory = [result, ...testHistory].slice(0, 10); // 只保留最近10条记录
      setTestHistory(updatedHistory);
      saveTestHistory(updatedHistory);

      // 设置测试完成状态
      setTestCompleted(true);
    } catch (error) {
      console.error('测速失败:', error);
      setError('测试过程中出现错误，请稍后重试');
    } finally {
      setTesting(false);
      // 不清空测试阶段和进度，保留显示
    }
  };

  // 添加一个监听历史记录侧边栏展开状态的函数
  useEffect(() => {
    const handleHistoryExpandChange = (expanded: boolean) => {
      setHistoryExpanded(expanded);
    };

    // 创建一个自定义事件监听器
    const handleCustomEvent = (e: CustomEvent) => {
      handleHistoryExpandChange(e.detail.expanded);
    };

    // 添加事件监听
    window.addEventListener('history-sidebar-toggle' as any, handleCustomEvent as EventListener);

    return () => {
      // 清理事件监听
      window.removeEventListener('history-sidebar-toggle' as any, handleCustomEvent as EventListener);
    };
  }, []);

  return (
    <div className="w-full h-full relative">
      {/* 主内容区域 - 使用flex并固定左侧 */}
      <div className="flex justify-center h-full">
        {/* 主测试容器 - 使用固定宽度并根据历史记录状态调整右侧边距 */}
        <div
          className="bg-white rounded-2xl shadow-md p-4 sm:p-6 max-w-4xl transition-all duration-300 ease-in-out"
          style={{
            marginRight: historyExpanded ? '80px' : '0',
            width: historyExpanded ? 'calc(100% - 80px)' : '100%',
            maxWidth: '800px'
          }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-4 sm:mb-8">
            网速测试
          </h1>

          {/* 主要测试结果 */}
          <div className="space-y-4 sm:space-y-6 mb-4 sm:mb-6">
            <div className="bg-gray-50 rounded-xl p-6">
              {/* Ping和抖动 */}
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                  <span className="text-base sm:text-lg font-medium text-gray-700">网络延迟</span>
                </div>
                <div>
                  {completedStages.has('ping') && ping === null ? (
                    <div className="flex items-center text-red-500">
                      <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                      <span className="text-base sm:text-lg font-medium">连接超时</span>
                    </div>
                  ) : (
                    <span className="text-xl sm:text-2xl font-bold text-indigo-600">
                      {ping !== null ? `${ping} ms` : '-'}
                    </span>
                  )}
                  {jitter !== null && (
                    <span className="text-xs sm:text-sm text-gray-500 ml-2">抖动: {jitter} ms</span>
                  )}
                </div>
              </div>

              {/* 丢包率 */}
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  <span className="text-base sm:text-lg font-medium text-gray-700">丢包率</span>
                </div>
                {completedStages.has('packetLoss') && packetLoss === null ? (
                  <div className="flex items-center text-red-500">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                    <span className="text-base sm:text-lg font-medium">连接超时</span>
                  </div>
                ) : (
                  <span className="text-xl sm:text-2xl font-bold text-purple-600">
                    {packetLoss !== null ? `${packetLoss}%` : '-'}
                  </span>
                )}
              </div>

              {/* 下载速度 */}
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Download className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  <span className="text-base sm:text-lg font-medium text-gray-700">下载速度</span>
                </div>
                {downloadSpeed === null && completedStages.has('download') ? (
                  <div className="flex items-center text-red-500">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                    <span className="text-base sm:text-lg font-medium">连接失败</span>
                  </div>
                ) : (
                  <span className="text-xl sm:text-2xl font-bold text-blue-600">
                    {downloadSpeed !== null ? `${downloadSpeed} Mbps` : '-'}
                  </span>
                )}
              </div>

              {/* 上传速度 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  <span className="text-base sm:text-lg font-medium text-gray-700">上传速度</span>
                </div>
                {uploadSpeed === null && completedStages.has('upload') ? (
                  <div className="flex items-center text-red-500">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                    <span className="text-base sm:text-lg font-medium">连接失败</span>
                  </div>
                ) : (
                  <span className="text-xl sm:text-2xl font-bold text-green-600">
                    {uploadSpeed !== null ? `${uploadSpeed} Mbps` : '-'}
                  </span>
                )}
              </div>
            </div>

            {/* 测试进度 - 在测试中显示和测试完成后保留 */}
            {(testing || testCompleted) && (
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
              className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-md transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>测试中...</span>
                </>
              ) : testCompleted ? (
                <>
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>再测一次</span>
                </>
              ) : (
                <>
                  <Gauge className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>开始测试</span>
                </>
              )}
            </button>
          </div>

          <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-gray-500 text-center">
            注意：实际网速可能因多种因素而异，包括网络拥堵、服务器负载和地理位置等
          </p>

          {/* 网速测试指标说明 - 调整了顶部边距，确保在大屏幕上有更大间距 */}
          <div className="mt-16 sm:mt-16 md:mt-16 lg:mt-20 border-t border-gray-200 pt-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 text-center">
              <div className="flex items-center justify-center">
                <Info className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 mr-2" />
                <span>网速测试的指标是如何计算的</span>
              </div>
            </h2>

            <div className="space-y-6">
              {/* 网络延迟 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Zap className="w-5 h-5 text-indigo-600 mr-2 flex-shrink-0" />
                  <h3 className="text-lg font-semibold text-gray-800">网络延迟 (Ping)</h3>
                </div>
                <p className="text-gray-600">
                  网络延迟是数据包从您的设备到测试服务器再返回所需的时间，以毫秒(ms)为单位。
                  测试会发送多个数据包，并计算往返时间的平均值，排除极端值以获得更准确的结果。
                  <span className="block mt-2 font-medium">影响因素：</span>
                  低延迟对在线游戏、视频通话和网页浏览的响应速度至关重要。理想的延迟值应低于50ms。
                </p>
              </div>

              {/* 抖动 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Activity className="w-5 h-5 text-purple-600 mr-2 flex-shrink-0" />
                  <h3 className="text-lg font-semibold text-gray-800">网络抖动 (Jitter)</h3>
                </div>
                <p className="text-gray-600">
                  抖动是网络延迟变化的度量，反映网络稳定性。计算方法是多次ping测试中延迟值的标准差。
                  抖动越小，网络连接越稳定；抖动值大表示网络连接不稳定。
                  <span className="block mt-2 font-medium">影响因素：</span>
                  高抖动会导致视频通话卡顿、在线游戏中的延迟波动和音频中断。理想值应低于10ms。
                </p>
              </div>

              {/* 丢包率 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <X className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                  <h3 className="text-lg font-semibold text-gray-800">丢包率 (Packet Loss)</h3>
                </div>
                <p className="text-gray-600">
                  丢包率是发送的数据包未成功到达目标服务器的百分比。测试过程会发送多个数据包并统计成功接收的比例。
                  计算方法为：(1 - 收到的包数/发送的包数) × 100%。
                  <span className="block mt-2 font-medium">影响因素：</span>
                  丢包会导致视频流中断、游戏卡顿和下载失败。良好的网络连接丢包率应低于1%。
                </p>
              </div>

              {/* 下载速度 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Download className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" />
                  <h3 className="text-lg font-semibold text-gray-800">下载速度 (Download)</h3>
                </div>
                <p className="text-gray-600">
                  下载速度是从互联网到您设备的数据传输速率，以Mbps(兆比特每秒)计量。
                  测试过程会下载不同大小的测试文件，计算下载所需时间，并应用公式：(文件大小 × 8) ÷ 下载时间。
                  <span className="block mt-2 font-medium">影响因素：</span>
                  下载速度影响网页加载、视频流媒体质量、文件下载和软件更新。高清视频流通常需要25+Mbps。
                </p>
              </div>

              {/* 上传速度 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Upload className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                  <h3 className="text-lg font-semibold text-gray-800">上传速度 (Upload)</h3>
                </div>
                <p className="text-gray-600">
                  上传速度是从您设备到互联网的数据传输速率，同样以Mbps计量。
                  测试时会生成随机数据并上传到测试服务器，通过公式：(上传数据大小 × 8) ÷ 上传时间计算。
                  <span className="block mt-2 font-medium">影响因素：</span>
                  上传速度影响视频会议质量、在线备份、社交媒体内容上传和云存储同步。视频会议通常需要5+Mbps。
                </p>
              </div>

              {/* 网络性能分析 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600 mr-2 flex-shrink-0" />
                  <h3 className="text-lg font-semibold text-gray-800">网络性能分析</h3>
                </div>
                <p className="text-gray-600">
                  综合评估网络性能需要同时考虑多项指标。理想的网络应该具有高下载/上传速度、低延迟、低抖动和极低的丢包率。
                  测试结果会根据这些指标生成网络性能评分。
                  <span className="block mt-2 font-medium">影响因素：</span>
                  网络性能受硬件(路由器、网卡)、连接类型(光纤、电缆、DSL)、ISP质量和网络拥塞影响。
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6">
              <p className="text-blue-800">
                <span className="font-medium">专业提示：</span> 为获得最准确的测试结果，请在测试期间关闭其他应用程序，尽量使用有线连接，并在不同时间段进行多次测试。结果可能因设备、路由器性能、网络拥塞和互联网服务提供商而异。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 历史记录侧边栏 - 与主容器顶部对齐 */}
      <div className="fixed right-0 h-auto z-10" style={{ top: 'calc(var(--nav-height, 80px))' }}>
        <SpeedTestHistory
          results={testHistory}
          onClearHistory={clearHistory}
          onToggle={setHistoryExpanded}
        />
      </div>
    </div>
  );
};

export default SpeedTestPage;