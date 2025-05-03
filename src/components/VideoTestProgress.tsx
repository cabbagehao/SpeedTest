import React, { useState, useEffect } from 'react';
import { Play, Gauge, Clock, X } from 'lucide-react';

interface VideoTestProgressProps {
  stage: string;
  progress: number;
  currentSite?: string;
}

const VideoTestProgress: React.FC<VideoTestProgressProps> = ({
  stage,
  progress,
  currentSite
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
      case '测量基本网络带宽':
        return { 
          title: '测量基本网络带宽', 
          icon: <Gauge className="w-5 h-5 text-indigo-600" />,
          description: '获取基准网络连接速度...'
        };
      default:
        if (stage.startsWith('测试') && currentSite) {
          return { 
            title: stage, 
            icon: <Play className="w-5 h-5 text-blue-600" />,
            description: `正在测试${currentSite}视频流媒体性能...`
          };
        } else if (stage === '分析结果') {
          return { 
            title: '分析测试结果', 
            icon: <Gauge className="w-5 h-5 text-green-600" />,
            description: '汇总数据并生成建议...'
          };
        } else if (stage === '测试完成') {
          return { 
            title: '测试完成', 
            icon: <Gauge className="w-5 h-5 text-green-600" />,
            description: '所有测试已完成'
          };
        } else {
          return { 
            title: stage || '准备测试', 
            icon: <Gauge className="w-5 h-5 text-gray-600" />,
            description: '准备开始视频流媒体测试...'
          };
        }
    }
  };

  const { title, icon, description } = getStageInfo();
  
  // 格式化时间
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
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
        {currentSite && (
          <span className="text-sm font-medium text-blue-600">
            {currentSite}
          </span>
        )}
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <div 
          className={`h-2.5 rounded-full ${
            stage === '测量基本网络带宽' ? 'bg-indigo-600' : 
            stage === '分析结果' ? 'bg-green-600' : 
            stage === '测试完成' ? 'bg-green-600' : 'bg-blue-600'
          }`}
          style={{ width: `${progress}%`, transition: 'width 0.3s ease-in-out' }}
        />
      </div>
      
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
};

export default VideoTestProgress; 