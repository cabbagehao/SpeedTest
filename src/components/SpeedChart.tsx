import React, { useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  Filler,
  TimeScale
} from 'chart.js';
import { SpeedDataPoint } from '../services';

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
);

// 下载速度测量器类型
interface DownloadSpeedMeterProps {
  onSpeedUpdate: (speed: number) => void;
  measurementInterval: number; // 测量间隔，单位毫秒
  isActive: boolean; // 是否激活测量
}

// 下载速度测量器组件
export const DownloadSpeedMeter: React.FC<DownloadSpeedMeterProps> = ({
  onSpeedUpdate,
  measurementInterval,
  isActive
}) => {
  // 使用ref跟踪状态，避免过多的重渲染
  const downloadState = useRef({
    testActive: false,
    startTime: 0,
    bytesReceived: 0,
    lastMeasurementTime: 0,
    lastUpdateTime: 0,
    speeds: [] as number[]
  });

  // 使用URL从CDN加载文件，测量下载速度
  const measureSpeed = async () => {
    if (!isActive) return;

    try {
      const state = downloadState.current;
      state.testActive = true;
      state.startTime = performance.now();
      state.bytesReceived = 0;
      state.lastMeasurementTime = state.startTime;
      state.lastUpdateTime = 0;
      state.speeds = [];

      console.log(`[DownloadMeter] 开始下载测量，时间: ${new Date().toISOString()}`);

      // 创建取消控制器，可以在组件卸载时中止请求
      const controller = new AbortController();

      // 使用随机参数防止缓存
      const cacheBuster = Date.now();
      // 从CDN下载大文件 - 使用更大的文件，确保测试持续时间足够长
      // 使用更快的CDN来源，以确保连接不会成为瓶颈
      // 使用多个文件来源增加可靠性
      const CDN_URLS = [
        `https://code.jquery.com/jquery-3.6.0.js?cb=${cacheBuster}`,
        `https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js?cb=${cacheBuster}`,
        `https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js?cb=${cacheBuster}`
      ];

      // 选择第一个CDN URL (可以根据需要实现更智能的选择)
      const selectedUrl = CDN_URLS[0];
      console.log(`[DownloadMeter] 使用CDN: ${selectedUrl}`);

      const response = await fetch(selectedUrl, {
        signal: controller.signal,
        cache: 'no-store'
      });

      // 获取响应的流
      const reader = response.body?.getReader();
      if (!reader) {
        console.error('[DownloadMeter] 无法获取响应流');
        return;
      }

      // 设置速度更新间隔 - 降低到50ms以提高更新频率
      let totalBytesReceived = 0;
      let measureStartTime = performance.now();
      let lastUpdateBytes = 0;

      const UPDATE_INTERVAL = Math.min(measurementInterval, 50); // 使用更短的更新间隔，最长不超过measurementInterval
      console.log(`[DownloadMeter] 设置更新间隔: ${UPDATE_INTERVAL}ms`);

      const updateInterval = setInterval(() => {
        const now = performance.now();
        const elapsedSec = (now - measureStartTime) / 1000;

        if (elapsedSec > 0 && state.bytesReceived > 0) {
          // 计算当前速度 (Mbps)，使用短期时间窗口
          const newBytes = state.bytesReceived - lastUpdateBytes;
          const speedMbps = (newBytes * 8) / elapsedSec / (1024 * 1024);

          const timestamp = new Date().toISOString();
          const formattedTime = timestamp.substring(11, 23); // 提取时:分:秒.毫秒

          // 只有当速度有意义变化才记录日志，避免日志过多
          if (newBytes > 0) {
            console.log(`[DownloadMeter] 更新速度: ${speedMbps.toFixed(2)} Mbps, 时间: ${formattedTime}, 距上次: ${(now - state.lastUpdateTime).toFixed(0)}ms, 新增: ${(newBytes/1024).toFixed(0)}KB, 总计: ${(totalBytesReceived/1024/1024).toFixed(2)}MB`);

            // 记录总接收字节数并更新lastUpdateBytes
            totalBytesReceived += newBytes;
            lastUpdateBytes = state.bytesReceived;

            // 重置时间，准备下一次测量
            measureStartTime = now;
            state.lastUpdateTime = now;

            // 通知速度更新
            onSpeedUpdate(speedMbps);
          }
        }
      }, UPDATE_INTERVAL);

      // 处理流数据
      while (state.testActive) {
        const { done, value } = await reader.read();

        if (done) {
          const timestamp = new Date().toISOString();
          const formattedTime = timestamp.substring(11, 23);
          console.log(`[DownloadMeter] 下载完成，时间: ${formattedTime}, 总计: ${(totalBytesReceived/1024/1024).toFixed(2)}MB`);
          break;
        }

        // 累计接收到的字节数
        if (value) {
          state.bytesReceived += value.length;

          // 更短间隔记录数据块，增加日志详细程度
          const now = new Date().toISOString();
          const formattedTime = now.substring(11, 23);
          console.log(`[DownloadMeter] 接收数据块: ${(value.length/1024).toFixed(0)}KB, 累计: ${(state.bytesReceived/1024).toFixed(0)}KB, 时间: ${formattedTime}`);
        }
      }

      // 清理
      clearInterval(updateInterval);
      reader.releaseLock();
      controller.abort();
    } catch (error) {
      console.error('[DownloadMeter] 下载速度测量失败:', error);
    }
  };

  // 当isActive变化时启动或停止测量
  useEffect(() => {
    if (isActive) {
      console.log(`[DownloadMeter] 激活下载测量, 时间: ${new Date().toISOString()}`);
      measureSpeed();
    } else {
      console.log(`[DownloadMeter] 停止下载测量, 时间: ${new Date().toISOString()}`);
      downloadState.current.testActive = false;
    }

    return () => {
      downloadState.current.testActive = false;
    };
  }, [isActive]);

  // 隐藏组件，仅负责测量
  return null;
};

interface SpeedChartProps {
  dataPoints: SpeedDataPoint[];
  title: string;
  color: string;
  backgroundColor: string;
  currentStage?: string;
  calculateRealtime?: boolean; // 是否计算实时速度
}

const SpeedChart: React.FC<SpeedChartProps> = ({
  dataPoints,
  title,
  color,
  backgroundColor,
  currentStage,
  calculateRealtime = false
}) => {
  // 保存实时生成的数据点
  const [realtimeDataPoints, setRealtimeDataPoints] = React.useState<SpeedDataPoint[]>([]);
  // 记录测试开始时间
  const testStartTimeRef = useRef<number>(0);

  // 处理实时速度更新
  const handleSpeedUpdate = (speed: number) => {
    const newPoint = { timestamp: Date.now(), speed };
    console.log(`[SpeedChart] 添加实时数据点: ${speed.toFixed(2)} Mbps, 时间: ${new Date().toISOString()}`);
    setRealtimeDataPoints(prevPoints => [...prevPoints, newPoint]);
  };

  // 每次阶段变化时清空实时数据点
  useEffect(() => {
    if (currentStage === 'download' && calculateRealtime) {
      console.log(`[SpeedChart] 进入下载阶段，清空数据点`);
      setRealtimeDataPoints([]);
      testStartTimeRef.current = Date.now(); // 重置测试开始时间
    }
  }, [currentStage, calculateRealtime]);

  // 显示的数据点
  const displayDataPoints = calculateRealtime && currentStage === 'download' ?
    realtimeDataPoints : dataPoints;

  // 计算测试经过的时间（秒）
  const getElapsedSeconds = (timestamp: number) => {
    // 如果是实时数据，计算与测试开始的时间差
    if (calculateRealtime && currentStage === 'download' && testStartTimeRef.current > 0) {
      return ((timestamp - testStartTimeRef.current) / 1000).toFixed(1);
    }

    // 如果是已有数据，则找出数据中最早的时间戳作为开始时间
    if (displayDataPoints.length > 0) {
      const firstTimestamp = displayDataPoints[0].timestamp;
      return ((timestamp - firstTimestamp) / 1000).toFixed(1);
    }

    return '0.0';
  };

  // 准备图表数据
  const getChartData = () => {
    if (displayDataPoints.length === 0) return getEmptyChartData();

    return {
      labels: displayDataPoints.map(dp => getElapsedSeconds(dp.timestamp) + 's'),
      datasets: [
        {
          label: title,
          data: displayDataPoints.map(dp => ({
            x: getElapsedSeconds(dp.timestamp) + 's',
            y: dp.speed,
            // 存储原始时间戳和速度用于悬停提示
            timestamp: dp.timestamp,
            originalSpeed: dp.speed,
            elapsedSeconds: getElapsedSeconds(dp.timestamp)
          })),
          borderColor: color,
          backgroundColor: backgroundColor,
          fill: true,
          tension: 0.3,
          pointRadius: 0, // 默认不显示点
          pointHoverRadius: 5, // 悬停时显示点
          borderWidth: 2
        }
      ]
    };
  };

  // 获取空白图表数据（显示网格但不显示数据）
  const getEmptyChartData = () => {
    // 简化为固定的秒数标签
    const labels = ['0.0s', '5.0s', '10.0s', '15.0s', '20.0s', '25.0s'];
    return {
      labels,
      datasets: [
        {
          label: title,
          data: [],
          borderColor: color,
          backgroundColor: backgroundColor,
          fill: true,
          borderWidth: 0
        }
      ]
    };
  };

  // 计算合适的横坐标间隔
  const calculateTickInterval = (dataPoints: SpeedDataPoint[]) => {
    if (dataPoints.length <= 0) return 3; // 默认每3个点显示一个标签

    // 根据数据点数量动态调整间隔
    if (dataPoints.length < 30) return 2;
    else if (dataPoints.length < 60) return 5;
    else if (dataPoints.length < 120) return 10;
    else if (dataPoints.length < 300) return 20;
    else if (dataPoints.length < 600) return 30;
    else return 60; // 数据点非常多时，每60个点显示一个标签
  };

  // 图表配置选项
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0 // 禁用动画以获得更流畅的更新
    },
    aspectRatio: 2.5, // 使图表更高
    plugins: {
      legend: {
        display: false, // 隐藏图例
      },
      tooltip: {
        callbacks: {
          title: (items) => {
            if (items.length > 0 && items[0].raw && typeof items[0].raw === 'object') {
              const rawData = items[0].raw as any;
              if (rawData.elapsedSeconds) {
                return `测试时间: ${rawData.elapsedSeconds}秒`;
              }
            }
            return `测试时间: ${items[0].label}`;
          },
          label: (context) => {
            // 使用原始速度值以保留精度
            if (context.raw && typeof context.raw === 'object') {
              const rawData = context.raw as any;
              if (rawData.originalSpeed !== undefined) {
                return `${title}: ${rawData.originalSpeed.toFixed(2)} Mbps`;
              }
            }
            return `${title}: ${context.parsed.y.toFixed(2)} Mbps`;
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 13
        },
        bodyFont: {
          size: 13,
          weight: 'bold'
        },
        padding: 10,
        displayColors: true
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Mbps'
        },
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: (value) => `${value}`
        }
      },
      x: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          // 动态调整显示间隔
          callback: (_, index, values) => {
            const tickInterval = calculateTickInterval(displayDataPoints);
            if (values.length <= 6 || index % tickInterval === 0) {
              return values[index].label;
            }
            return null;
          },
          maxRotation: 0,
          autoSkip: true,
          autoSkipPadding: 20
        }
      }
    },
    elements: {
      point: {
        radius: 0, // 默认不显示点
        hoverRadius: 5 // 悬停时显示点
      },
      line: {
        tension: 0.3
      }
    }
  };

  return (
    <div className="bg-white rounded-xl p-3 h-full">
      {calculateRealtime && currentStage === 'download' && (
        <DownloadSpeedMeter
          onSpeedUpdate={handleSpeedUpdate}
          measurementInterval={100} // 100ms = 10Hz
          isActive={currentStage === 'download'}
        />
      )}

      <Line
        data={displayDataPoints.length > 0 ? getChartData() : getEmptyChartData()}
        options={chartOptions}
        height={180}
      />
    </div>
  );
};

export default SpeedChart;