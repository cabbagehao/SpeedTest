import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SpeedTestPage from './pages/SpeedTestPage';
import FAQPage from './pages/FAQPage';
import LearnPage from './pages/LearnPage';
import LeaderboardPage from './pages/LeaderboardPage';
import Navigation from './components/Navigation';
import ThrottleTestButton from './components/ThrottleTestButton';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 flex flex-col relative overflow-hidden">
        {/* 背景几何图形装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-200 opacity-50 blur-3xl"></div>
          <div className="absolute top-1/3 -left-24 w-80 h-80 rounded-full bg-indigo-200 opacity-40 blur-3xl"></div>
          <div className="absolute -bottom-32 right-1/4 w-72 h-72 rounded-full bg-purple-200 opacity-40 blur-3xl"></div>
        </div>
        
        {/* 页面级导航栏 - 固定在顶部 */}
        <div className="w-full bg-white shadow-md sticky top-0 z-10">
          <div className="container mx-auto px-4">
            <Navigation />
          </div>
        </div>
        
        {/* 页面内容 */}
        <div className="flex-1 flex items-center justify-center p-4 relative z-0">
          <div className="container max-w-3xl">
            <Routes>
              <Route path="/" element={<SpeedTestPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/learn" element={<LearnPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
            </Routes>
          </div>
        </div>
        
        {/* 限速测试按钮（只在开发模式显示） */}
        <ThrottleTestButton />
      </div>
    </Router>
  );
}

export default App;