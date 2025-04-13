import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import SpeedTestPage from './pages/SpeedTestPage';
import LeaderboardPage from './pages/LeaderboardPage';
import StreamingTestPage from './pages/StreamingTestPage';
import WebLoadingTestPage from './pages/WebLoadingTestPage';
import VideoConferenceTestPage from './pages/VideoConferenceTestPage';
import GameLatencyTestPage from './pages/GameLatencyTestPage';
import AdvancedTestPage from './pages/AdvancedTestPage';
import LearnPage from './pages/LearnPage';
import FAQPage from './pages/FAQPage';

function App() {
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <Navigation />
        
        <div className="mb-8 mt-8">
          <Routes>
            <Route path="/" element={<SpeedTestPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/streaming-test" element={<StreamingTestPage />} />
            <Route path="/web-loading-test" element={<WebLoadingTestPage />} />
            <Route path="/video-conference-test" element={<VideoConferenceTestPage />} />
            <Route path="/game-latency-test" element={<GameLatencyTestPage />} />
            <Route path="/advanced-test" element={<AdvancedTestPage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        
        <footer className="text-center text-gray-500 text-sm mt-8">
          <p>© {new Date().getFullYear()} 闪电测速 - 高性能网络测速工具</p>
        </footer>
      </div>
    </div>
  );
}

export default App;