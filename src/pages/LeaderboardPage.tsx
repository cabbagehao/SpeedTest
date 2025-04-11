import React, { useState, useEffect } from 'react';
import { Trophy, Download, Upload, Zap, Calendar, MapPin, Medal, User } from 'lucide-react';
import type { SpeedTestResult } from '../services/speedTest';

// 本地存储键
const HISTORY_STORAGE_KEY = 'speedtest_history';

// 随机用户姓氏列表
const surnames = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '林', '郭', '何', '高', '罗'];

// 随机城市列表
const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆', '青岛', '长沙', '天津', '苏州', '郑州', '东莞', '沈阳', '济南', '宁波', '厦门'];

// 随机ISP列表
const isps = ['电信', '联通', '移动', '广电', '铁通', '长城宽带', '鹏博士', '教育网'];

// 生成随机用户
const generateRandomUser = () => {
  const surname = surnames[Math.floor(Math.random() * surnames.length)];
  const userId = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${surname}${userId}`;
};

// 生成随机位置
const generateRandomLocation = () => {
  const city = cities[Math.floor(Math.random() * cities.length)];
  const isp = isps[Math.floor(Math.random() * isps.length)];
  return { city, isp };
};

// 扩展测速结果
interface ExtendedSpeedTestResult extends SpeedTestResult {
  user: string;
  location: {
    city: string;
    isp: string;
  };
  rank?: number;
}

const LeaderboardPage: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<ExtendedSpeedTestResult[]>([]);
  const [sortBy, setSortBy] = useState<'download' | 'upload' | 'ping'>('download');
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'all'>('all');
  
  // 加载测速历史并创建模拟排行榜
  useEffect(() => {
    try {
      // 获取本地存储的测速历史
      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      let history: SpeedTestResult[] = [];
      
      if (savedHistory) {
        history = JSON.parse(savedHistory);
      }
      
      // 如果历史记录不足，生成一些模拟数据
      if (history.length < 20) {
        const mockData = generateMockData(20 - history.length);
        history = [...history, ...mockData];
      }
      
      // 为历史记录添加用户和位置信息
      const extendedHistory: ExtendedSpeedTestResult[] = history.map(result => ({
        ...result,
        user: generateRandomUser(),
        location: generateRandomLocation()
      }));
      
      // 根据选择的时间范围筛选
      const filteredLeaderboard = filterByTimeRange(extendedHistory, timeRange);
      
      // 根据排序条件排序
      const sortedLeaderboard = sortLeaderboard(filteredLeaderboard, sortBy);
      
      // 添加排名
      const rankedLeaderboard = sortedLeaderboard.map((item, index) => ({
        ...item,
        rank: index + 1
      }));
      
      setLeaderboard(rankedLeaderboard);
    } catch (error) {
      console.error('无法加载排行榜数据:', error);
    }
  }, [sortBy, timeRange]);
  
  // 生成模拟数据
  const generateMockData = (count: number): SpeedTestResult[] => {
    const mockData: SpeedTestResult[] = [];
    
    for (let i = 0; i < count; i++) {
      mockData.push({
        downloadSpeed: Math.floor(Math.random() * 500) + 50, // 50-550 Mbps
        uploadSpeed: Math.floor(Math.random() * 300) + 10,   // 10-310 Mbps
        ping: Math.floor(Math.random() * 50) + 5,           // 5-55 ms
        jitter: Math.floor(Math.random() * 20) + 1,         // 1-21 ms
        packetLoss: parseFloat((Math.random() * 2).toFixed(2)), // 0-2%
        timestamp: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // 最近30天内
        testServer: '默认服务器',
        downloadDataPoints: [],
        uploadDataPoints: []
      });
    }
    
    return mockData;
  };
  
  // 根据时间范围筛选数据
  const filterByTimeRange = (data: ExtendedSpeedTestResult[], range: string): ExtendedSpeedTestResult[] => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    switch (range) {
      case 'day':
        return data.filter(item => (now - item.timestamp) < dayMs);
      case 'week':
        return data.filter(item => (now - item.timestamp) < 7 * dayMs);
      case 'month':
        return data.filter(item => (now - item.timestamp) < 30 * dayMs);
      case 'all':
      default:
        return data;
    }
  };
  
  // 根据条件排序数据
  const sortLeaderboard = (data: ExtendedSpeedTestResult[], criteria: string): ExtendedSpeedTestResult[] => {
    return [...data].sort((a, b) => {
      if (criteria === 'download') {
        return (b.downloadSpeed || 0) - (a.downloadSpeed || 0);
      } else if (criteria === 'upload') {
        return (b.uploadSpeed || 0) - (a.uploadSpeed || 0);
      } else if (criteria === 'ping') {
        // 对于ping，数值越小越好
        return (a.ping || 999) - (b.ping || 999);
      }
      return 0;
    });
  };
  
  // 获取排名对应的颜色和图标
  const getRankDisplay = (rank: number) => {
    if (rank === 1) {
      return {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: <Medal className="w-5 h-5 text-yellow-600" />
      };
    } else if (rank === 2) {
      return {
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        icon: <Medal className="w-5 h-5 text-gray-500" />
      };
    } else if (rank === 3) {
      return {
        color: 'text-amber-700',
        bgColor: 'bg-amber-100',
        icon: <Medal className="w-5 h-5 text-amber-700" />
      };
    } else {
      return {
        color: 'text-gray-700',
        bgColor: 'bg-white',
        icon: null
      };
    }
  };
  
  // 格式化时间戳
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="backdrop-blur-sm bg-white/50 rounded-2xl shadow-xl p-6 w-full">
      <div className="flex items-center mb-6">
        <Trophy className="w-7 h-7 text-indigo-600 mr-2" />
        <h1 className="text-3xl font-bold text-gray-800">网速排行榜</h1>
      </div>
      
      {/* 筛选控制 */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">排序依据</label>
          <div className="flex space-x-2">
            <button
              onClick={() => setSortBy('download')}
              className={`flex items-center px-3 py-2 rounded-md ${
                sortBy === 'download' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200/80'
              }`}
            >
              <Download className="w-4 h-4 mr-1" />
              下载速度
            </button>
            <button
              onClick={() => setSortBy('upload')}
              className={`flex items-center px-3 py-2 rounded-md ${
                sortBy === 'upload' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200/80'
              }`}
            >
              <Upload className="w-4 h-4 mr-1" />
              上传速度
            </button>
            <button
              onClick={() => setSortBy('ping')}
              className={`flex items-center px-3 py-2 rounded-md ${
                sortBy === 'ping' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200/80'
              }`}
            >
              <Zap className="w-4 h-4 mr-1" />
              网络延迟
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">时间范围</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-gray-100/80 border border-gray-300 text-gray-700 rounded-md px-3 py-2"
          >
            <option value="day">今日</option>
            <option value="week">本周</option>
            <option value="month">本月</option>
            <option value="all">全部</option>
          </select>
        </div>
      </div>
      
      {/* 排行榜表格 */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                排名
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                用户
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                位置
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Download className="w-4 h-4 inline mr-1" />
                下载
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Upload className="w-4 h-4 inline mr-1" />
                上传
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Zap className="w-4 h-4 inline mr-1" />
                延迟
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Calendar className="w-4 h-4 inline mr-1" />
                测试时间
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leaderboard.map((item) => {
              const rankStyle = getRankDisplay(item.rank || 0);
              
              return (
                <tr 
                  key={`${item.user}-${item.timestamp}`}
                  className={`${rankStyle.bgColor} hover:bg-gray-50`}
                >
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className={`flex items-center justify-center ${rankStyle.color} font-bold`}>
                      {rankStyle.icon || item.rank}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="font-medium">{item.user}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-500 mr-1" />
                      <span>{item.location.city} ({item.location.isp})</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span className={`${sortBy === 'download' ? 'font-bold text-blue-600' : ''}`}>
                      {item.downloadSpeed} Mbps
                    </span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span className={`${sortBy === 'upload' ? 'font-bold text-green-600' : ''}`}>
                      {item.uploadSpeed} Mbps
                    </span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span className={`${sortBy === 'ping' ? 'font-bold text-indigo-600' : ''}`}>
                      {item.ping} ms
                    </span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(item.timestamp)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>排行榜基于测速结果生成，展示了不同用户的互联网连接性能对比。</p>
        <p className="mt-1">自己进行测速后，您可以将结果与其他用户进行比较。</p>
      </div>
    </div>
  );
};

export default LeaderboardPage; 