import React from 'react';
import { Download, Upload, Zap, Clock, X } from 'lucide-react';
import type { SpeedTestResult } from '../services/speedTest';

interface SpeedTestHistoryProps {
  results: SpeedTestResult[];
}

const SpeedTestHistory: React.FC<SpeedTestHistoryProps> = ({ results }) => {
  if (results.length === 0) {
    return null;
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
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2" />
        历史记录
      </h2>
      
      <div className="space-y-4 max-h-60 overflow-y-auto">
        {results.map((result, index) => (
          <div 
            key={index} 
            className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-100"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">{formatTimestamp(result.timestamp)}</span>
              <span className="text-xs text-gray-400">{result.testServer}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <Download className="w-4 h-4 text-blue-500 mr-2" />
                <span className="text-gray-600 text-sm">下载:</span>
                <span className="font-semibold text-gray-800 ml-1">
                  {result.downloadSpeed !== null ? `${result.downloadSpeed} Mbps` : '-'}
                </span>
              </div>
              
              <div className="flex items-center">
                <Upload className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-gray-600 text-sm">上传:</span>
                <span className="font-semibold text-gray-800 ml-1">
                  {result.uploadSpeed !== null ? `${result.uploadSpeed} Mbps` : '-'}
                </span>
              </div>
              
              <div className="flex items-center">
                <Zap className="w-4 h-4 text-indigo-500 mr-2" />
                <span className="text-gray-600 text-sm">Ping:</span>
                <span className="font-semibold text-gray-800 ml-1">
                  {result.ping !== null ? `${result.ping} ms` : '-'}
                </span>
              </div>
              
              <div className="flex items-center">
                <span className="text-gray-600 text-sm">抖动:</span>
                <span className="font-semibold text-gray-800 ml-1">
                  {result.jitter !== null ? `${result.jitter} ms` : '-'}
                </span>
              </div>
              
              {result.packetLoss !== null && (
                <div className="flex items-center col-span-2">
                  <X className="w-4 h-4 text-purple-500 mr-2" />
                  <span className="text-gray-600 text-sm">丢包率:</span>
                  <span className="font-semibold text-gray-800 ml-1">
                    {result.packetLoss}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpeedTestHistory; 