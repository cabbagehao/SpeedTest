import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gauge, Bookmark, Activity } from 'lucide-react';

const Navigation: React.FC = () => {
  const location = useLocation();

  // 检查当前路径是否匹配
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // 主导航链接数据
  const mainNavLinks = [
    { path: '/', text: '网速测试', icon: <Gauge className="w-5 h-5" /> },
    { path: '/stability-test', text: '宽带稳定性测试', icon: <Activity className="w-5 h-5" /> },
    { path: '/faq', text: '常见问题', icon: <Bookmark className="w-5 h-5" /> },
  ];

  return (
    <nav className="w-full py-4">
      <div className="w-full flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <span className="text-2xl font-bold text-indigo-600">SpeedTest</span>
          <span className="ml-1 text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded-md uppercase tracking-wider">Beta</span>
        </div>

        {/* 导航链接 */}
        <div className="flex space-x-2">
          {/* 所有导航链接 */}
          {mainNavLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center px-4 py-2 transition-colors relative ${
                isActive(link.path)
                  ? 'text-indigo-700'
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