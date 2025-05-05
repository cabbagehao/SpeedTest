import React, { useState, useEffect } from 'react';
import { Sliders, Clock, FileText } from 'lucide-react';
import { testSettings, updateTestSettings, TEST_SIZES } from '../services';

const TestSettings: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [manualFileSize, setManualFileSize] = useState(false);
  const [downloadFileSize, setDownloadFileSize] = useState(testSettings.downloadFileSize);
  const [uploadFileSize, setUploadFileSize] = useState(testSettings.uploadFileSize);
  const [downloadMinDuration, setDownloadMinDuration] = useState(testSettings.downloadTestDuration.min / 1000);
  const [uploadMinDuration, setUploadMinDuration] = useState(testSettings.uploadTestDuration.min / 1000);

  // 当任何设置变化时，更新全局测试设置
  useEffect(() => {
    updateTestSettings({
      autoFileSize: !manualFileSize,
      downloadFileSize,
      uploadFileSize,
      downloadTestDuration: {
        min: downloadMinDuration * 1000,
        max: downloadMinDuration * 1000 + 3000
      },
      uploadTestDuration: {
        min: uploadMinDuration * 1000,
        max: uploadMinDuration * 1000 + 3000
      }
    });
  }, [
    manualFileSize,
    downloadFileSize,
    uploadFileSize,
    downloadMinDuration,
    uploadMinDuration
  ]);

  const fileSizeOptions = [
    { label: '256 KB', value: TEST_SIZES.XS },
    { label: '1 MB', value: TEST_SIZES.S },
    { label: '5 MB', value: TEST_SIZES.M },
    { label: '10 MB', value: TEST_SIZES.L },
    { label: '100 MB', value: TEST_SIZES.XL }
  ];

  // 处理测试时间更改
  const handleDurationChange = (
    value: number,
    setter: React.Dispatch<React.SetStateAction<number>>,
    min: number = 10,
    max: number = 300
  ) => {
    // 限制在有效范围内
    const validValue = Math.max(min, Math.min(max, value));
    setter(validValue);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 rounded-full shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white"
          title="测试设置"
        >
          <Sliders className="w-6 h-6" />
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl p-4 w-80">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-gray-800">测试设置</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <span className="text-lg">&times;</span>
            </button>
          </div>

          {/* 文件大小设置 */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <FileText className="w-4 h-4 mr-2 text-indigo-600" />
              <label className="block text-sm font-medium text-gray-700">文件大小设置</label>
            </div>

            {/* 手动选择文件大小开关 */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">手动选择文件大小</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={manualFileSize}
                  onChange={() => setManualFileSize(!manualFileSize)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* 下载文件大小 */}
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">下载文件大小</label>
              <div className="grid grid-cols-5 gap-1">
                {fileSizeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDownloadFileSize(option.value)}
                    className={`text-center px-2 py-1 text-xs rounded ${
                      downloadFileSize === option.value
                        ? 'bg-blue-600 text-white' + (!manualFileSize ? ' opacity-50' : '')
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                    disabled={!manualFileSize}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 上传文件大小 */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">上传文件大小</label>
              <div className="grid grid-cols-5 gap-1">
                {fileSizeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setUploadFileSize(option.value)}
                    className={`text-center px-2 py-1 text-xs rounded ${
                      uploadFileSize === option.value
                        ? 'bg-blue-600 text-white' + (!manualFileSize ? ' opacity-50' : '')
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                    disabled={!manualFileSize}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 测试时间设置 */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <Clock className="w-4 h-4 mr-2 text-indigo-600" />
              <label className="block text-sm font-medium text-gray-700">测试时间设置</label>
            </div>

            {/* 下载测试时间 */}
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">下载测试时间 (秒)</label>
              <div>
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="1"
                  value={downloadMinDuration}
                  onChange={(e) => handleDurationChange(parseInt(e.target.value), setDownloadMinDuration, 12, 300)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{downloadMinDuration}秒</span>
                </div>
              </div>
            </div>

            {/* 上传测试时间 */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">上传测试时间 (秒)</label>
              <div>
                <input
                  type="range"
                  min="8"
                  max="300"
                  step="1"
                  value={uploadMinDuration}
                  onChange={(e) => handleDurationChange(parseInt(e.target.value), setUploadMinDuration, 8, 300)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{uploadMinDuration}秒</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <p>这些设置将应用于所有速度测试，刷新页面后将恢复默认设置</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestSettings;