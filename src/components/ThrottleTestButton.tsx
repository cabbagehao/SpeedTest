import React, { useState, useEffect } from 'react';
import { Sliders, X, Download, RefreshCw } from 'lucide-react';
import { throttleSettings, updateThrottleSettings } from './ThrottleTestSettings';

const ThrottleTestButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [throttleEnabled, setThrottleEnabled] = useState(false);
  const [selectedThrottle, setSelectedThrottle] = useState<number>(0);
  const [selectedFileSize, setSelectedFileSize] = useState('s'); // 默认1MB
  
  // 判断是否为开发模式
  const isDevelopment = import.meta.env.MODE === 'development';
  
  if (!isDevelopment) {
    return null;
  }
  
  // 当任何设置变化时，更新全局限速设置
  useEffect(() => {
    updateThrottleSettings(throttleEnabled, selectedThrottle, selectedFileSize);
  }, [throttleEnabled, selectedThrottle, selectedFileSize]);
  
  const throttleOptions = [
    { label: '50 KB/s (0.4 Mbps)', value: 50 },
    { label: '200 KB/s (1.6 Mbps)', value: 200 },
    { label: '500 KB/s (4 Mbps)', value: 500 },
    { label: '1 MB/s (8 Mbps)', value: 1000 },
    { label: '2 MB/s (16 Mbps)', value: 2000 },
    { label: '5 MB/s (40 Mbps)', value: 5000 },
    { label: '10 MB/s (80 Mbps)', value: 10000 },
    { label: '无限速', value: 0 }
  ];
  
  const fileSizeOptions = [
    { label: '256 KB', value: 'xs' },
    { label: '1 MB', value: 's' },
    { label: '5 MB', value: 'm' },
    { label: '10 MB', value: 'l' },
    { label: '100 MB', value: 'xl' }
  ];
  
  const applyThrottleSetting = (throttle: number) => {
    setSelectedThrottle(throttle);
    setThrottleEnabled(throttle > 0);
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className={`p-3 rounded-full shadow-lg flex items-center justify-center ${
            throttleEnabled 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
          title={throttleEnabled ? `限速已启用: ${selectedThrottle} KB/s` : "限速测试控制"}
        >
          <Sliders className="w-6 h-6" />
          {throttleEnabled && <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full"></span>}
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl p-4 w-80">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-gray-800">
              网速限制控制
              {throttleEnabled && <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">已启用</span>}
            </h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="bg-yellow-50 p-3 rounded-lg mb-4 text-sm text-yellow-700">
            <p>此设置将应用到所有网速测试中。限速设置仅用于开发和测试目的。</p>
          </div>
          
          {/* 状态切换 */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">启用限速</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox"
                checked={throttleEnabled}
                onChange={() => setThrottleEnabled(!throttleEnabled)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          
          {/* 文件大小选择 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              测试文件大小
            </label>
            <div className="grid grid-cols-5 gap-1">
              {fileSizeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedFileSize(option.value)}
                  className={`text-center px-2 py-1 text-xs rounded ${
                    selectedFileSize === option.value 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* 限速选项 */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              限速选项
            </label>
            <div className="space-y-1">
              {throttleOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => applyThrottleSetting(option.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded ${
                    selectedThrottle === option.value && throttleEnabled
                      ? 'bg-indigo-100 text-indigo-700 font-medium' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <span>{option.label}</span>
                  {selectedThrottle === option.value && throttleEnabled && (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <p>开发工具 - 仅在开发模式下可见</p>
            <p>启用后，所有网速测试将使用所选限速进行</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThrottleTestButton; 