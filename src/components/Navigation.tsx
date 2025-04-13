import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gauge, Bookmark, BookOpen, Award, Video, Globe, Gamepad2, ChevronDown, Video as VideoIcon } from 'lucide-react';

const Navigation: React.FC = () => {
  const location = useLocation();
  const [showAdvancedMenu, setShowAdvancedMenu] = useState(false);
  
  // 检查当前路径是否匹配
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  // 检查当前路径是否是高级测试页面
  const isAdvancedTest = () => {
    const advancedPaths = [
      '/streaming-test',
      '/web-loading-test',
      '/game-latency-test',
      '/video-conference-test'
    ];
    return advancedPaths.includes(location.pathname);
  };
  
  // 高级测试菜单项
  const advancedTestMenuItems = [
    { 
      path: '/streaming-test', 
      text: '流媒体测试', 
      icon: <Video className="w-5 h-5" />,
      description: '测试网络流媒体播放能力'
    },
    { 
      path: '/web-loading-test', 
      text: '网页加载测试', 
      icon: <Globe className="w-5 h-5" />,
      description: '测试网页浏览速度和性能'
    },
    { 
      path: '/game-latency-test', 
      text: '游戏延迟测试', 
      icon: <Gamepad2 className="w-5 h-5" />,
      description: '评估网络游戏性能和延迟'
    },
    { 
      path: '/video-conference-test', 
      text: '视频会议测试', 
      icon: <VideoIcon className="w-5 h-5" />,
      description: '分析网络视频会议质量'
    }
  ];
  
  // 主导航链接数据
  const mainNavLinks = [
    { path: '/', text: '网速测试', icon: <Gauge className="w-5 h-5" /> },
    { path: '/faq', text: '常见问题', icon: <Bookmark className="w-5 h-5" /> },
    { path: '/learn', text: '网速课堂', icon: <BookOpen className="w-5 h-5" /> },
    { path: '/leaderboard', text: '速度排行榜', icon: <Award className="w-5 h-5" /> },
  ];
  
  return (
    <nav className="py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <span className="text-2xl font-bold text-indigo-600">SpeedTest</span>
          <span className="ml-1 text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded-md uppercase tracking-wider">Beta</span>
        </div>
        
        {/* 导航链接 */}
        <div className="flex space-x-2">
          {/* 基础网速测试 */}
          <Link
            to="/"
            className={`flex items-center px-4 py-2 transition-colors relative ${
              isActive('/')
                ? 'text-indigo-700 font-semibold'
                : 'text-gray-600 hover:text-indigo-600'
            }`}
          >
            <span className={`mr-2 ${isActive('/') ? 'text-indigo-600' : ''}`}>
              <Gauge className="w-5 h-5" />
            </span>
            <span>网速测试</span>
            {isActive('/') && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>
            )}
          </Link>
          
          {/* 高级测试下拉菜单 */}
          <div className="relative">
            <button
              onClick={() => setShowAdvancedMenu(!showAdvancedMenu)}
              className={`flex items-center px-4 py-2 transition-colors relative ${
                isAdvancedTest()
                  ? 'text-indigo-700 font-semibold'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
              onBlur={() => setTimeout(() => setShowAdvancedMenu(false), 200)}
            >
              <span className={`mr-1 ${isAdvancedTest() ? 'text-indigo-600' : ''}`}>
                <Gauge className="w-5 h-5" />
              </span>
              <span>高级测试</span>
              <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showAdvancedMenu ? 'rotate-180' : ''}`} />
              {isAdvancedTest() && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>
              )}
            </button>
            
            {/* 下拉菜单 */}
            {showAdvancedMenu && (
              <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg py-2 w-64 z-50">
                {advancedTestMenuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-start px-4 py-3 transition-colors hover:bg-indigo-50 ${
                      isActive(item.path) ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <span className={`mr-3 mt-0.5 ${isActive(item.path) ? 'text-indigo-600' : 'text-gray-500'}`}>
                      {item.icon}
                    </span>
                    <div>
                      <div className={`${isActive(item.path) ? 'font-medium text-indigo-700' : 'text-gray-700'}`}>
                        {item.text}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          {/* 其他导航链接 */}
          {mainNavLinks.slice(1).map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center px-4 py-2 transition-colors relative ${
                isActive(link.path)
                  ? 'text-indigo-700 font-semibold'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              <span className={`mr-2 ${isActive(link.path) ? 'text-indigo-600' : ''}`}>
                {link.icon}
              </span>
              <span>{link.text}</span>
              {isActive(link.path) && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 