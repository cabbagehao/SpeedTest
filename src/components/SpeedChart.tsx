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
  ChartOptions
} from 'chart.js';
import { SpeedDataPoint } from '../services/speedTest';

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SpeedChartProps {
  downloadDataPoints: SpeedDataPoint[];
  uploadDataPoints: SpeedDataPoint[];
  currentStage?: string;
  currentSpeed?: number;
}

const SpeedChart: React.FC<SpeedChartProps> = ({
  downloadDataPoints,
  uploadDataPoints,
  currentStage,
  currentSpeed
}) => {
  const chartRef = useRef<ChartJS>(null);

  // 格式化时间戳为可读格式
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 准备图表数据
  const getChartData = () => {
    // 转换数据格式
    const labels = [...new Set([
      ...downloadDataPoints.map(dp => formatTimestamp(dp.timestamp)),
      ...uploadDataPoints.map(dp => formatTimestamp(dp.timestamp))
    ])].sort();

    return {
      labels,
      datasets: [
        {
          label: '下载速度 (Mbps)',
          data: downloadDataPoints.map(dp => ({
            x: formatTimestamp(dp.timestamp),
            y: dp.speed
          })),
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 5
        },
        {
          label: '上传速度 (Mbps)',
          data: uploadDataPoints.map(dp => ({
            x: formatTimestamp(dp.timestamp),
            y: dp.speed
          })),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.5)',
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 5
        }
      ]
    };
  };

  // 图表配置选项
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '网速测试实时数据'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} Mbps`;
          }
        }
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: '速度 (Mbps)'
        },
        beginAtZero: true
      },
      x: {
        title: {
          display: true,
          text: '时间'
        }
      }
    }
  };

  // 当当前速度更新时，更新图表
  useEffect(() => {
    if (chartRef.current && currentSpeed && currentStage) {
      const chart = chartRef.current;

      // 添加当前点
      if (currentStage === 'download' || currentStage === 'upload') {
        // 图表已经通过数据点更新，无需手动追加
      }
    }
  }, [currentSpeed, currentStage]);

  return (
    <div className="w-full h-64 bg-white rounded-xl p-4 shadow-sm">
      {(downloadDataPoints.length > 0 || uploadDataPoints.length > 0) ? (
        <Line 
          ref={chartRef}
          data={getChartData()} 
          options={chartOptions} 
          height={240}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          测试开始后将显示速度曲线图
        </div>
      )}
    </div>
  );
};

export default SpeedChart; 