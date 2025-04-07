import React from 'react';
import { Download, Upload, Gauge, Zap, X } from 'lucide-react';

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
  // 确定当前阶段的标题和图标
  const getStageInfo = () => {
    switch (stage) {
      case 'ping':
        return { title: '测量网络延迟', icon: <Zap className="w-5 h-5 text-indigo-500" /> };
      case 'packetLoss':
        return { title: '测量丢包率', icon: <X className="w-5 h-5 text-purple-500" /> };
      case 'download':
        return { title: '测试下载速度', icon: <Download className="w-5 h-5 text-blue-500" /> };
      case 'upload':
        return { title: '测试上传速度', icon: <Upload className="w-5 h-5 text-green-500" /> };
      default:
        return { title: '准备测试', icon: <Gauge className="w-5 h-5 text-gray-500" /> };
    }
  };

  const { title, icon } = getStageInfo();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {icon}
          <span className="font-medium text-gray-700">{title}</span>
        </div>
        <div className="text-sm font-medium">
          {progress < 100 && stage !== 'ping' && stage !== 'packetLoss' && currentSpeed !== undefined ? 
            `${currentSpeed.toFixed(2)} Mbps` : ''}
          
          {stage === 'ping' && ping !== undefined && ping !== null && progress === 100 ? 
            `${ping} ms / ${jitter} ms抖动` : ''}
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5">
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
    </div>
  );
};

export default SpeedTestProgress; 