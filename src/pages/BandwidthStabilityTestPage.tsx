import React, { useState, useEffect, useRef } from 'react';
import { Download, Upload, Clock, Play, Pause, RefreshCw, AlertCircle, Settings, Loader } from 'lucide-react';
import { testDownloadSpeed, testUploadSpeed, SpeedDataPoint } from '../services/speedTest';
import SpeedChart from '../components/SpeedChart';

const BandwidthStabilityTestPage: React.FC = () => {
  // 测试状态
  const [testing, setTesting] = useState<boolean>(false);
  const [testDuration, setTestDuration] = useState<number>(10); // 默认10分钟
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [testProgress, setTestProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  // 添加测试设置面板的展开状态
  const [settingsExpanded, setSettingsExpanded] = useState<boolean>(false);
  // 添加停止按钮loading状态
  const [stoppingTest, setStoppingTest] = useState<boolean>(false);
  // 添加测试完成状态
  const [testCompleted, setTestCompleted] = useState<boolean>(false);

  // 测试选项
  const [enableDownload, setEnableDownload] = useState<boolean>(true);
  const [enableUpload, setEnableUpload] = useState<boolean>(true);

  // 测试时长选项
  const durationOptions = [
    { value: 5, label: '5分钟' },
    { value: 10, label: '10分钟' },
    { value: 20, label: '20分钟' }
  ];

  // 数据稳定阈值（秒），忽略前2秒的数据，避免初始连接不稳定
  const DATA_STABILITY_THRESHOLD = 2;

  // 测试数据
  const [downloadDataPoints, setDownloadDataPoints] = useState<SpeedDataPoint[]>([]);
  const [uploadDataPoints, setUploadDataPoints] = useState<SpeedDataPoint[]>([]);
  const [currentDownloadSpeed, setCurrentDownloadSpeed] = useState<number | null>(null);
  const [currentUploadSpeed, setCurrentUploadSpeed] = useState<number | null>(null);
  const [avgDownloadSpeed, setAvgDownloadSpeed] = useState<number | null>(null);
  const [avgUploadSpeed, setAvgUploadSpeed] = useState<number | null>(null);
  const [minDownloadSpeed, setMinDownloadSpeed] = useState<number | null>(null);
  const [maxDownloadSpeed, setMaxDownloadSpeed] = useState<number | null>(null);
  const [minUploadSpeed, setMinUploadSpeed] = useState<number | null>(null);
  const [maxUploadSpeed, setMaxUploadSpeed] = useState<number | null>(null);

  // 测试开始时间戳
  const testStartTimeRef = useRef<number>(0);

  // 参考值，用于存储定时器ID
  const timerRef = useRef<number | null>(null);
  const testActiveRef = useRef<boolean>(false);
  const stopTimeoutRef = useRef<number | null>(null);

  // 下载测试进度回调
  const onDownloadProgress = (stage: string, progress: number, speed?: number, dataPoints?: SpeedDataPoint[]) => {
    if (speed !== undefined && testActiveRef.current) {
      setCurrentDownloadSpeed(speed);

      // 计算当前距离测试开始的时间（秒）
      const secondsSinceTestStart = (Date.now() - testStartTimeRef.current) / 1000;

      // 如果是测试初期的不稳定数据，则不更新最大最小值和平均值
      if (secondsSinceTestStart >= DATA_STABILITY_THRESHOLD) {
        // 更新最大最小值 - 使用直接设置而不是条件更新，确保适当更新
        setMinDownloadSpeed(prevMin =>
          prevMin === null || speed < prevMin ? speed : prevMin
        );

        setMaxDownloadSpeed(prevMax =>
          prevMax === null || speed > prevMax ? speed : prevMax
        );
      }

      // 添加数据点
      if (dataPoints && dataPoints.length > 0 && testActiveRef.current) {
        setDownloadDataPoints(prev => {
          const newPoints = [...prev];
          const lastPoint = dataPoints[dataPoints.length - 1];

          // 只添加新的数据点，避免重复
          if (newPoints.length === 0 || newPoints[newPoints.length - 1].timestamp !== lastPoint.timestamp) {
            newPoints.push(lastPoint);
          }

          // 计算平均下载速度 - 只使用稳定期的数据
          if (newPoints.length > 0) {
            // 过滤掉初始不稳定阶段的数据点
            const stablePoints = newPoints.filter(
              point => (point.timestamp - testStartTimeRef.current) / 1000 >= DATA_STABILITY_THRESHOLD
            );

            if (stablePoints.length > 0) {
              const sum = stablePoints.reduce((acc, point) => acc + point.speed, 0);
              setAvgDownloadSpeed(sum / stablePoints.length);
            }
          }

          return newPoints;
        });
      } else {
        // 如果没有数据点但有速度，创建一个新的数据点
        const newPoint = { timestamp: Date.now(), speed };
        setDownloadDataPoints(prev => {
          const newPoints = [...prev, newPoint];

          // 计算平均下载速度 - 只使用稳定期的数据
          // 过滤掉初始不稳定阶段的数据点
          const stablePoints = newPoints.filter(
            point => (point.timestamp - testStartTimeRef.current) / 1000 >= DATA_STABILITY_THRESHOLD
          );

          if (stablePoints.length > 0) {
            const sum = stablePoints.reduce((acc, point) => acc + point.speed, 0);
            setAvgDownloadSpeed(sum / stablePoints.length);
          }

          return newPoints;
        });
      }
    }
  };

  // 上传测试进度回调
  const onUploadProgress = (stage: string, progress: number, speed?: number, dataPoints?: SpeedDataPoint[]) => {
    if (speed !== undefined && testActiveRef.current) {
      setCurrentUploadSpeed(speed);

      // 计算当前距离测试开始的时间（秒）
      const secondsSinceTestStart = (Date.now() - testStartTimeRef.current) / 1000;

      // 如果是测试初期的不稳定数据，则不更新最大最小值和平均值
      if (secondsSinceTestStart >= DATA_STABILITY_THRESHOLD) {
        // 更新最大最小值 - 使用直接设置而不是条件更新，确保适当更新
        setMinUploadSpeed(prevMin =>
          prevMin === null || speed < prevMin ? speed : prevMin
        );

        setMaxUploadSpeed(prevMax =>
          prevMax === null || speed > prevMax ? speed : prevMax
        );
      }

      // 添加数据点
      if (dataPoints && dataPoints.length > 0 && testActiveRef.current) {
        setUploadDataPoints(prev => {
          const newPoints = [...prev];
          const lastPoint = dataPoints[dataPoints.length - 1];

          // 只添加新的数据点，避免重复
          if (newPoints.length === 0 || newPoints[newPoints.length - 1].timestamp !== lastPoint.timestamp) {
            newPoints.push(lastPoint);
          }

          // 计算平均上传速度 - 只使用稳定期的数据
          if (newPoints.length > 0) {
            // 过滤掉初始不稳定阶段的数据点
            const stablePoints = newPoints.filter(
              point => (point.timestamp - testStartTimeRef.current) / 1000 >= DATA_STABILITY_THRESHOLD
            );

            if (stablePoints.length > 0) {
              const sum = stablePoints.reduce((acc, point) => acc + point.speed, 0);
              setAvgUploadSpeed(sum / stablePoints.length);
            }
          }

          return newPoints;
        });
      } else {
        // 如果没有数据点但有速度，创建一个新的数据点
        const newPoint = { timestamp: Date.now(), speed };
        setUploadDataPoints(prev => {
          const newPoints = [...prev, newPoint];

          // 计算平均上传速度 - 只使用稳定期的数据
          // 过滤掉初始不稳定阶段的数据点
          const stablePoints = newPoints.filter(
            point => (point.timestamp - testStartTimeRef.current) / 1000 >= DATA_STABILITY_THRESHOLD
          );

          if (stablePoints.length > 0) {
            const sum = stablePoints.reduce((acc, point) => acc + point.speed, 0);
            setAvgUploadSpeed(sum / stablePoints.length);
          }

          return newPoints;
        });
      }
    }
  };

  // 测试结果统计 - 这些计算过程移到一个单独的计算函数中
  const calculateSpeedStats = () => {
    // 下载统计
    let downloadStats = {
      min: minDownloadSpeed !== null ? minDownloadSpeed : null,
      max: maxDownloadSpeed !== null ? maxDownloadSpeed : null,
      avg: avgDownloadSpeed !== null ? avgDownloadSpeed : null,
      range: minDownloadSpeed !== null && maxDownloadSpeed !== null
        ? (maxDownloadSpeed - minDownloadSpeed)
        : null
    };

    // 上传统计
    let uploadStats = {
      min: minUploadSpeed !== null ? minUploadSpeed : null,
      max: maxUploadSpeed !== null ? maxUploadSpeed : null,
      avg: avgUploadSpeed !== null ? avgUploadSpeed : null,
      range: minUploadSpeed !== null && maxUploadSpeed !== null
        ? (maxUploadSpeed - minUploadSpeed)
        : null
    };

    return { downloadStats, uploadStats };
  };

  // 执行下载速度测试
  const runDownloadSpeedTest = async () => {
    try {
      const result = await testDownloadSpeed(onDownloadProgress);
      console.log('下载速度测试完成:', result?.speed);
      return result.speed;
    } catch (error) {
      console.error('下载测试失败:', error);
      return null;
    }
  };

  // 执行上传速度测试
  const runUploadSpeedTest = async () => {
    try {
      const result = await testUploadSpeed(onUploadProgress);
      console.log('上传速度测试完成:', result?.speed);
      return result.speed;
    } catch (error) {
      console.error('上传测试失败:', error);
      return null;
    }
  };

  // 启动持续测试
  const startContinuousTest = async () => {
    // 检查是否至少选择了一种测试类型
    if (!enableDownload && !enableUpload) {
      setError('请至少选择一种测试类型（上传或下载）');
      return;
    }

    // 清空之前的数据 - 只有开始新测试时才清空
    setDownloadDataPoints([]);
    setUploadDataPoints([]);
    setCurrentDownloadSpeed(null);
    setCurrentUploadSpeed(null);
    setAvgDownloadSpeed(null);
    setMinDownloadSpeed(null);
    setMaxDownloadSpeed(null);
    setAvgUploadSpeed(null);
    setMinUploadSpeed(null);
    setMaxUploadSpeed(null);

    // 重置测试完成状态
    setTestCompleted(false);

    // 记录测试开始时间
    testStartTimeRef.current = Date.now();

    setTesting(true);
    setError(null);
    setElapsedTime(0);
    setTestProgress(0);

    testActiveRef.current = true;

    // 启动计时器
    const startTime = Date.now();
    const durationMs = testDuration * 60 * 1000;

    timerRef.current = window.setInterval(() => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;

      if (elapsed >= durationMs) {
        // 测试完成
        stopContinuousTest();
        return;
      }

      // 更新已经过的时间和进度
      setElapsedTime(Math.floor(elapsed / 1000));
      setTestProgress((elapsed / durationMs) * 100);
    }, 1000);

    // 启动循环测试
    const runTestLoop = async () => {
      try {
        console.log('开始测试循环');
        // 记录循环执行次数，用于调试
        let loopCount = 0;

        while (testActiveRef.current) {
          loopCount++;
          console.log(`测试循环 #${loopCount} 开始`);

          // 根据选项决定执行哪些测试
          const promises = [];

          if (enableDownload && testActiveRef.current) {
            promises.push(runDownloadSpeedTest());
          }

          if (enableUpload && testActiveRef.current) {
            promises.push(runUploadSpeedTest());
          }

          // 如果测试已经停止，不再执行测试
          if (!testActiveRef.current) {
            console.log('测试已停止，退出测试循环');
            break;
          }

          // 执行选择的测试
          try {
            await Promise.all(promises);
            console.log(`测试循环 #${loopCount} 完成`);
          } catch (error) {
            console.error(`测试循环 #${loopCount} 出错:`, error);
            // 即使测试出错，也继续循环，因为这可能只是临时网络问题
          }

          // 检查是否应该停止测试
          if (!testActiveRef.current) {
            console.log('测试标记为停止，退出测试循环');
            break;
          }

          // 等待短暂时间后继续下一次测试
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log('测试循环结束，总共执行了', loopCount, '次循环');
      } catch (err) {
        console.error('测试循环出现异常:', err);
        setError('测试过程中发生错误，请稍后重试');
        stopContinuousTest();
      }
    };

    // 启动测试循环
    runTestLoop().catch(err => {
      console.error('测试循环出错:', err);
      setError('测试过程中发生错误，请稍后重试');
      stopContinuousTest();
    });
  };

  // 停止持续测试
  const stopContinuousTest = () => {
    // 设置停止中状态
    setStoppingTest(true);

    // 标记测试已停止，这样新的数据点不会被添加
    testActiveRef.current = false;

    // 设置一个3秒超时，确保即使网络关闭缓慢也能恢复UI
    stopTimeoutRef.current = window.setTimeout(() => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setTesting(false);
      setStoppingTest(false);
      // 设置测试完成状态
      setTestCompleted(true);
      // 注意：这里不清空测试结果统计数据
    }, 3000);

    // 立即尝试清理资源
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 模拟网络关闭延迟
    setTimeout(() => {
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
        stopTimeoutRef.current = null;
      }
      setTesting(false);
      setStoppingTest(false);
      // 设置测试完成状态
      setTestCompleted(true);
      // 注意：这里不清空测试结果统计数据
    }, Math.random() * 2000 + 500);
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
      }
      testActiveRef.current = false;
    };
  }, []);

  // 格式化时间为分:秒格式
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 格式化测试进度百分比
  const formatProgress = (progress: number) => {
    return `${Math.round(progress)}%`;
  };

  // 切换测试设置面板的显示状态
  const toggleSettings = () => {
    setSettingsExpanded(prev => !prev);
  };

  // 点击页面其他地方关闭设置面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        settingsExpanded &&
        !target.closest('.settings-panel') &&
        !target.closest('.settings-button')
      ) {
        setSettingsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [settingsExpanded]);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          宽带稳定性测试
        </h1>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* 测试状态和进度 - 始终显示，只有进度条在测试开始后才显示 */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 shadow-sm mb-4 sm:mb-6">
          <div className="flex justify-between items-center mb-3">
            {(testing || testCompleted) && (
              <h3 className="text-base font-medium text-gray-700">测试进度</h3>
            )}
            {testing && (
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium">
                  已测试 {formatTime(elapsedTime)} / {formatTime(testDuration * 60)}
                </span>
              </div>
            )}
            {testCompleted && !testing && (
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium">
                  测试完成
                </span>
              </div>
            )}
          </div>

          {/* 进度条在测试时显示和测试完成后保留 */}
          {(testing || testCompleted) ? (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
              <div
                className="bg-indigo-600 h-2.5 rounded-full"
                style={{ width: `${testProgress}%` }}
              ></div>
            </div>
          ) : (
            <div className="w-full h-2.5 mb-6"></div>
          )}

          {/* 开始/停止按钮 - 根据测试状态改变样式 */}
          <div className="flex justify-center">
            <button
              onClick={testing ? stopContinuousTest : startContinuousTest}
              disabled={stoppingTest}
              className={`flex items-center space-x-2 rounded-lg text-white font-medium transition-colors shadow-md ${
                testing
                  ? 'py-2 px-6 bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                  : 'py-3 px-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400'
              }`}
            >
              {stoppingTest ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>停止中...</span>
                </>
              ) : testing ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>停止测试</span>
                </>
              ) : testCompleted ? (
                <>
                  <RefreshCw className="w-5 h-5" />
                  <span className="text-base">再测一次</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span className="text-base">开始测试</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 错误消息 */}
        {error && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg mb-4 sm:mb-6">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* 实时速度曲线 - 移到前面显眼位置 */}
        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">实时速度曲线</h3>

          {/* 下载速度曲线图 */}
          {enableDownload && (
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <div className="flex items-center">
                  <Download className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-1 sm:mr-2" />
                  <h4 className="text-xs sm:text-sm font-medium text-gray-700">下载速度</h4>
                </div>
                {/* 当前下载速度显示在曲线图右侧 */}
                {currentDownloadSpeed !== null && (
                  <div className="text-lg font-bold text-blue-600">
                    {currentDownloadSpeed.toFixed(2)} Mbps
                  </div>
                )}
              </div>
              <div className="h-32 sm:h-48">
                <SpeedChart
                  dataPoints={downloadDataPoints}
                  title="下载速度"
                  color="rgb(59, 130, 246)"
                  backgroundColor="rgba(59, 130, 246, 0.1)"
                  calculateRealtime={true}
                />
              </div>
            </div>
          )}

          {/* 上传速度曲线图 */}
          {enableUpload && (
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <div className="flex items-center">
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-1 sm:mr-2" />
                  <h4 className="text-xs sm:text-sm font-medium text-gray-700">上传速度</h4>
                </div>
                {/* 当前上传速度显示在曲线图右侧 */}
                {currentUploadSpeed !== null && (
                  <div className="text-lg font-bold text-green-600">
                    {currentUploadSpeed.toFixed(2)} Mbps
                  </div>
                )}
              </div>
              <div className="h-32 sm:h-48">
                <SpeedChart
                  dataPoints={uploadDataPoints}
                  title="上传速度"
                  color="rgb(34, 197, 94)"
                  backgroundColor="rgba(34, 197, 94, 0.1)"
                />
              </div>
            </div>
          )}
        </div>

        {/* 测试结果统计 */}
        {(
          (enableDownload && downloadDataPoints.length > 0) ||
          (enableUpload && uploadDataPoints.length > 0)
        ) && (
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 shadow-sm mb-4 sm:mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">测试结果统计</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 下载速度统计 */}
              {enableDownload && downloadDataPoints.length > 0 && (() => {
                const { downloadStats } = calculateSpeedStats();
                return (
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">下载速度</h4>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">平均速度:</span>
                        <span className="text-sm font-semibold text-blue-600">
                          {downloadStats.avg !== null ? `${downloadStats.avg.toFixed(2)} Mbps` : '-'}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">最低速度:</span>
                        <span className="text-sm font-semibold text-blue-600">
                          {downloadStats.min !== null ? `${downloadStats.min.toFixed(2)} Mbps` : '-'}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">最高速度:</span>
                        <span className="text-sm font-semibold text-blue-600">
                          {downloadStats.max !== null ? `${downloadStats.max.toFixed(2)} Mbps` : '-'}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">波动范围:</span>
                        <span className="text-sm font-semibold text-blue-600">
                          {downloadStats.range !== null
                            ? `${downloadStats.range.toFixed(2)} Mbps`
                            : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 上传速度统计 */}
              {enableUpload && uploadDataPoints.length > 0 && (() => {
                const { uploadStats } = calculateSpeedStats();
                return (
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">上传速度</h4>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">平均速度:</span>
                        <span className="text-sm font-semibold text-green-600">
                          {uploadStats.avg !== null ? `${uploadStats.avg.toFixed(2)} Mbps` : '-'}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">最低速度:</span>
                        <span className="text-sm font-semibold text-green-600">
                          {uploadStats.min !== null ? `${uploadStats.min.toFixed(2)} Mbps` : '-'}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">最高速度:</span>
                        <span className="text-sm font-semibold text-green-600">
                          {uploadStats.max !== null ? `${uploadStats.max.toFixed(2)} Mbps` : '-'}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">波动范围:</span>
                        <span className="text-sm font-semibold text-green-600">
                          {uploadStats.range !== null
                            ? `${uploadStats.range.toFixed(2)} Mbps`
                            : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      <p className="mt-2 text-xs sm:text-sm text-gray-500 text-center">
        注意：长时间测试可能会消耗较多流量，建议在无流量限制的网络环境下进行测试
      </p>

      {/* 右下角固定的设置按钮和弹出配置面板 */}
      <div className="fixed bottom-24 right-6 z-10">
        <div className="relative">
          {/* 悬浮的设置面板 */}
          {settingsExpanded && (
            <div className="settings-panel absolute bottom-16 right-0 bg-white rounded-xl p-6 border border-gray-200 shadow-lg w-[350px] z-20 mb-2">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex justify-between items-center">
                <span>测试设置</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="testDuration" className="block text-sm font-medium text-gray-700 mb-2">
                    测试时长 (分钟)
                  </label>
                  <select
                    id="testDuration"
                    value={testDuration}
                    onChange={(e) => setTestDuration(parseInt(e.target.value) || 10)}
                    disabled={testing}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    {durationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    测试类型
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        id="enableDownload"
                        type="checkbox"
                        checked={enableDownload}
                        onChange={(e) => {
                          const newValue = e.target.checked;
                          // 确保至少选择一项
                          if (newValue || enableUpload) {
                            setEnableDownload(newValue);
                          }
                        }}
                        disabled={testing || (!enableUpload)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="enableDownload" className="ml-2 flex items-center text-sm text-gray-700">
                        <Download className="w-4 h-4 text-blue-600 mr-1" />
                        测试下载速度
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="enableUpload"
                        type="checkbox"
                        checked={enableUpload}
                        onChange={(e) => {
                          const newValue = e.target.checked;
                          // 确保至少选择一项
                          if (newValue || enableDownload) {
                            setEnableUpload(newValue);
                          }
                        }}
                        disabled={testing || (!enableDownload)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="enableUpload" className="ml-2 flex items-center text-sm text-gray-700">
                        <Upload className="w-4 h-4 text-green-600 mr-1" />
                        测试上传速度
                      </label>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  <p>该测试将根据您的选择进行上传和下载测试，直到设定的时间结束。</p>
                </div>
              </div>
            </div>
          )}

          {/* 设置按钮 */}
          <button
            onClick={toggleSettings}
            className="settings-button flex items-center justify-center p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 transform"
            aria-label="测试设置"
          >
            <Settings className="w-6 h-6" />
          </button>

          {/* 悬停提示 */}
          <div className="absolute right-0 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-800 text-white text-xs rounded py-1 px-2 pointer-events-none whitespace-nowrap">
            测试设置
          </div>
        </div>
      </div>
    </div>
  );
};

export default BandwidthStabilityTestPage;