import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full py-6 mt-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-600 text-sm">
              © {currentYear} SpeedTest Beta. 保留所有权利。
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            <a 
              href="https://github.com/your-username/speedtest" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-indigo-600 text-sm transition-colors"
            >
              GitHub
            </a>
            <Link 
              to="/privacy" 
              className="text-gray-600 hover:text-indigo-600 text-sm transition-colors"
            >
              隐私政策
            </Link>
            <Link 
              to="/terms" 
              className="text-gray-600 hover:text-indigo-600 text-sm transition-colors"
            >
              使用条款
            </Link>
            <Link 
              to="/about" 
              className="text-gray-600 hover:text-indigo-600 text-sm transition-colors"
            >
              关于我们
            </Link>
          </div>
        </div>
        
        <div className="mt-4 text-center text-gray-500 text-xs flex items-center justify-center">
          <span>用</span>
          <Heart className="w-3 h-3 mx-1 text-red-500" />
          <span>制作 | 为用户提供快速、准确的网络测速服务</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 