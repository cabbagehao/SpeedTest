import React, { useState, useEffect } from 'react';
import { Trophy, Download, Upload, Zap, Calendar, MapPin, Medal, User, Globe, Network, Building } from 'lucide-react';
import type { SpeedTestResult } from '../services/speedTest';

// 服务器API基础URL
const API_BASE_URL = 'http://localhost:3001/api';

// 位置信息接口
interface LocationInfo {
  anonymizedIp: string;
  city: string;
  country: string;
  continent: string;
  asn: number;
  isp: string;
}

// 扩展测速结果
interface ExtendedSpeedTestResult extends SpeedTestResult {
  location: LocationInfo;
  rank?: number;
}

// 过滤选项接口
interface FilterOptions {
  cities: string[];
  countries: string[];
  asns: { asn: number; isp: string }[];
}

const LeaderboardPage: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<ExtendedSpeedTestResult[]>([]);
  const [sortBy, setSortBy] = useState<'download' | 'upload' | 'ping'>('download');
  const [filterType, setFilterType] = useState<'global' | 'city' | 'country' | 'asn'>('global');
  const [filterValue, setFilterValue] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ cities: [], countries: [], asns: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 加载过滤选项
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/leaderboard/filters`);
        if (!response.ok) {
          throw new Error('无法获取过滤选项');
        }
        
        const data = await response.json();
        if (data.success && data.filterOptions) {
          setFilterOptions(data.filterOptions);
        }
      } catch (error) {
        console.error('获取过滤选项失败:', error);
        setError('无法加载过滤选项，请稍后再试');
      }
    };
    
    fetchFilterOptions();
  }, []);
  
  // 加载排行榜数据
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // 构建API请求URL
        let url = `${API_BASE_URL}/leaderboard?sortBy=${sortBy}`;
        
        if (filterType !== 'global' && filterValue) {
          url += `&filterType=${filterType}&filterValue=${encodeURIComponent(filterValue)}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('无法获取排行榜数据');
        }
        
        const data = await response.json();
        if (data.success && Array.isArray(data.leaderboard)) {
          // 添加排名
          const rankedData = data.leaderboard.map((item: any, index: number) => ({
            ...item,
            rank: index + 1
          }));
          
          setLeaderboard(rankedData);
        } else {
          setLeaderboard([]);
        }
      } catch (error) {
        console.error('获取排行榜数据失败:', error);
        setError('无法加载排行榜数据，请稍后再试');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboardData();
  }, [sortBy, filterType, filterValue]);
  
  // 处理过滤类型变更
  const handleFilterTypeChange = (type: 'global' | 'city' | 'country' | 'asn') => {
    setFilterType(type);
    setFilterValue(null);
  };
  
  // 处理过滤值变更
  const handleFilterValueChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterValue(event.target.value);
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
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full">
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
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Zap className="w-4 h-4 mr-1" />
              网络延迟
            </button>
          </div>
        </div>
        
        {/* 过滤条件 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">地区筛选</label>
          <div className="flex space-x-2 mb-2">
            <button
              onClick={() => handleFilterTypeChange('global')}
              className={`flex items-center px-3 py-2 rounded-md ${
                filterType === 'global' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Globe className="w-4 h-4 mr-1" />
              全球
            </button>
            <button
              onClick={() => handleFilterTypeChange('city')}
              className={`flex items-center px-3 py-2 rounded-md ${
                filterType === 'city' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Building className="w-4 h-4 mr-1" />
              城市
            </button>
            <button
              onClick={() => handleFilterTypeChange('country')}
              className={`flex items-center px-3 py-2 rounded-md ${
                filterType === 'country' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MapPin className="w-4 h-4 mr-1" />
              国家
            </button>
            <button
              onClick={() => handleFilterTypeChange('asn')}
              className={`flex items-center px-3 py-2 rounded-md ${
                filterType === 'asn' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Network className="w-4 h-4 mr-1" />
              ISP
            </button>
          </div>
          
          {/* 根据选择的过滤类型显示不同的下拉选项 */}
          {filterType !== 'global' && (
            <select
              value={filterValue || ''}
              onChange={handleFilterValueChange}
              className="bg-gray-100 border border-gray-300 text-gray-700 rounded-md px-3 py-2 w-full"
            >
              <option value="">选择{filterType === 'city' ? '城市' : filterType === 'country' ? '国家' : 'ISP'}</option>
              {filterType === 'city' && filterOptions.cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
              {filterType === 'country' && filterOptions.countries.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
              {filterType === 'asn' && filterOptions.asns.map((asn) => (
                <option key={asn.asn} value={asn.asn}>{asn.isp} (ASN: {asn.asn})</option>
              ))}
            </select>
          )}
        </div>
      </div>
      
      {/* 加载状态和错误提示 */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">正在加载排行榜数据...</span>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {/* 排行榜表格 */}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  排名
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP地址
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
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                    暂无排行榜数据
                  </td>
                </tr>
              ) : (
                leaderboard.map((item) => {
                  const rankStyle = getRankDisplay(item.rank || 0);
                  
                  return (
                    <tr 
                      key={`${item.location?.anonymizedIp}-${item.timestamp}`}
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
                          <span className="font-medium">{item.location?.anonymizedIp || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-500 mr-1" />
                          <span>
                            {item.location?.city || 'Unknown'} 
                            {item.location?.country && `, ${item.location.country}`}
                            {item.location?.isp && ` (${item.location.isp})`}
                          </span>
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
                })
              )}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>排行榜基于真实测速结果生成，展示了不同用户的互联网连接性能对比。</p>
        <p className="mt-1">自己进行测速后，如果结果超过当前记录，您将进入排行榜。</p>
      </div>
    </div>
  );
};

export default LeaderboardPage; 