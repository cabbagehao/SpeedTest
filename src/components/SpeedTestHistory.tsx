import React, { useState } from 'react';
import { Download, Upload, Zap, Clock, X, Trash2, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react';
import type { SpeedTestResult } from '../services/speedTest';

interface SpeedTestHistoryProps {
  results: SpeedTestResult[];
  onClearHistory?: () => void;
}

const SpeedTestHistory: React.FC<SpeedTestHistoryProps> = ({ results, onClearHistory }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (results.length === 0 && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed right-0 top-1/3 bg-indigo-600 text-white py-3 px-2 rounded-l-lg shadow-md hover:bg-indigo-700 transition-all duration-300"
      >
        <Clock className="w-5 h-5 mb-1" />
        <ChevronLeft className="w-5 h-5" />
      </button>
    );
  }

  // 格式化时间戳
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div 
      className={`fixed right-0 top-0 h-full bg-white shadow-xl transition-all duration-300 ease-in-out z-10 flex ${
        isExpanded ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ width: isExpanded ? '320px' : '0' }}
    >
      {/* 展开/收起按钮 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute left-0 top-1/3 transform -translate-x-full bg-indigo-600 text-white py-3 px-2 rounded-l-lg shadow-md hover:bg-indigo-700 transition-all duration-300"
      >
        <Clock className="w-5 h-5 mb-1" />
        {isExpanded ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>

      {/* 历史记录内容 */}
      <div className="w-full h-full overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-700 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            测速历史记录
          </h2>
          {onClearHistory && (
            <button 
              onClick={onClearHistory}
              className="flex items-center text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              清除
            </button>
          )}
        </div>
        
        {results.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4 text-gray-500">
            暂无历史记录
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">{formatTimestamp(result.timestamp)}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <Download className="w-4 h-4 text-blue-500 mr-2" />
                      <span className="text-gray-600 text-sm">下载:</span>
                      {result.downloadSpeed !== null ? (
                        <span className="font-semibold text-gray-800 ml-1">
                          {result.downloadSpeed} Mbps
                        </span>
                      ) : (
                        <div className="flex items-center ml-1 text-red-500">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          <span className="text-xs">失败</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <Upload className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-gray-600 text-sm">上传:</span>
                      {result.uploadSpeed !== null ? (
                        <span className="font-semibold text-gray-800 ml-1">
                          {result.uploadSpeed} Mbps
                        </span>
                      ) : (
                        <div className="flex items-center ml-1 text-red-500">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          <span className="text-xs">失败</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <Zap className="w-4 h-4 text-indigo-500 mr-2" />
                      <span className="text-gray-600 text-sm">Ping:</span>
                      {result.ping !== null ? (
                        <span className="font-semibold text-gray-800 ml-1">
                          {result.ping} ms
                        </span>
                      ) : (
                        <div className="flex items-center ml-1 text-red-500">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          <span className="text-xs">超时</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-gray-600 text-sm">抖动:</span>
                      {result.jitter !== null ? (
                        <span className="font-semibold text-gray-800 ml-1">
                          {result.jitter} ms
                        </span>
                      ) : (
                        <span className="text-gray-400 ml-1">-</span>
                      )}
                    </div>
                    
                    {result.packetLoss !== null ? (
                      <div className="flex items-center col-span-2">
                        <X className="w-4 h-4 text-purple-500 mr-2" />
                        <span className="text-gray-600 text-sm">丢包率:</span>
                        <span className="font-semibold text-gray-800 ml-1">
                          {result.packetLoss}%
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center col-span-2">
                        <X className="w-4 h-4 text-purple-500 mr-2" />
                        <span className="text-gray-600 text-sm">丢包率:</span>
                        <div className="flex items-center ml-1 text-red-500">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          <span className="text-xs">超时</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeedTestHistory; 