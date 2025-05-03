import React, { useState, useEffect } from 'react';
import { Download, Upload, Gauge, Zap, X, Clock } from 'lucide-react';

interface SpeedTestProgressProps {
  stage: string;
  progress: number;
  currentSpeed?: number;
  ping?: number | null;
  jitter?: number | null;
}

const SpeedTestProgress: React.FC<SpeedTestProgressProps> = ({
  stage,
  progress,
  currentSpeed,
  ping,
  jitter
}) => {
  // 跟踪测试持续时间
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [previousStage, setPreviousStage] = useState('');
  
  // 当阶段改变时重置计时器
  useEffect(() => {
    if (stage !== previousStage) {
      setElapsedSeconds(0);
      setPreviousStage(stage);
    }
  }, [stage]);
  
  // 计时器效果
  useEffect(() => {
    let timer: number;
    
    if (stage && progress < 100 && progress > 0) {
      timer = window.setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [stage, progress]);
  
  // 确定当前阶段的标题和图标
  const getStageInfo = () => {
    switch (stage) {
      case 'ping':
        return { 
          title: '测量网络延迟', 
          icon: <Zap className="w-5 h-5 text-indigo-500" />,
          description: '测量服务器响应时间和抖动...'
        };
      case 'packetLoss':
        return { 
          title: '测量丢包率', 
          icon: <X className="w-5 h-5 text-purple-500" />,
          description: '发送多个数据包并计算丢失比例...'
        };
      case 'download':
        return { 
          title: '测试下载速度', 
          icon: <Download className="w-5 h-5 text-blue-500" />,
          description: '持续下载数据以测量最佳性能...'
        };
      case 'upload':
        return { 
          title: '测试上传速度', 
          icon: <Upload className="w-5 h-5 text-green-500" />,
          description: '持续上传数据以测量最佳性能...'
        };
      default:
        return { 
          title: '准备测试', 
          icon: <Gauge className="w-5 h-5 text-gray-500" />,
          description: '准备开始网速测试...'
        };
    }
  };

  const { title, icon, description } = getStageInfo();
  
  // 格式化时间
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // 获取速度单位颜色
  const getSpeedColor = () => {
    if (currentSpeed === undefined) return 'text-gray-500';
    
    if (stage === 'download') {
      if (currentSpeed < 5) return 'text-red-500';
      if (currentSpeed < 20) return 'text-yellow-500';
      if (currentSpeed < 50) return 'text-green-500';
      return 'text-blue-500';
    } else if (stage === 'upload') {
      if (currentSpeed < 2) return 'text-red-500';
      if (currentSpeed < 10) return 'text-yellow-500';
      if (currentSpeed < 30) return 'text-green-500';
      return 'text-blue-500';
    }
    
    return 'text-gray-500';
  };
  
  const speedColor = getSpeedColor();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {icon}
          <span className="font-medium text-gray-700">{title}</span>
          {elapsedSeconds > 0 && (
            <div className="flex items-center text-xs text-gray-500 ml-2">
              <Clock className="w-3 h-3 mr-1" />
              <span>{formatTime(elapsedSeconds)}</span>
            </div>
          )}
        </div>
        <div className="text-sm font-medium">
          {progress < 100 && stage !== 'ping' && stage !== 'packetLoss' && currentSpeed !== undefined ? (
            <span className={`font-bold ${speedColor}`}>
              {currentSpeed.toFixed(2)} Mbps
            </span>
          ) : null}
          
          {stage === 'ping' && ping !== undefined && ping !== null && progress === 100 ? 
            `${ping} ms / ${jitter} ms抖动` : ''}
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <div 
          className={`h-2.5 rounded-full ${
            stage === 'ping' ? 'bg-indigo-500' : 
            stage === 'packetLoss' ? 'bg-purple-500' :
            stage === 'download' ? 'bg-blue-500' : 
            stage === 'upload' ? 'bg-green-500' : 'bg-gray-500'
          }`}
          style={{ width: `${progress}%`, transition: 'width 0.3s ease-in-out' }}
        />
      </div>
      
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
};

export default SpeedTestProgress; 