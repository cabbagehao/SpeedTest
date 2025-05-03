import React, { useEffect, useRef } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import SpeedTestPage from './pages/SpeedTestPage';
import FAQPage from './pages/FAQPage';
import BandwidthStabilityTestPage from './pages/BandwidthStabilityTestPage';

function App() {
  const location = useLocation();
  const navRef = useRef<HTMLDivElement>(null);

  // 计算导航栏高度并设置为CSS变量
  useEffect(() => {
    const updateNavHeight = () => {
      if (navRef.current) {
        const navHeight = navRef.current.offsetHeight;
        document.documentElement.style.setProperty('--nav-height', `${navHeight}px`);
      }
    };

    updateNavHeight();
    window.addEventListener('resize', updateNavHeight);

    return () => {
      window.removeEventListener('resize', updateNavHeight);
    };
  }, []);

  return (
    <div className="min-h-screen h-screen flex flex-col bg-gray-100">
      <div className="w-full flex flex-col flex-grow bg-gray-100">
        <div ref={navRef} className="w-full px-2 sm:px-4 md:px-8 py-2 sm:py-4 md:py-8">
          <Navigation />
        </div>

        <div className="w-full flex-grow flex flex-col px-2 sm:px-4 md:px-8 mb-4 sm:mb-8">
          <Routes>
            <Route path="/" element={<SpeedTestPage />} />
            <Route path="/stability-test" element={<BandwidthStabilityTestPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        <div className="w-full px-2 sm:px-4 md:px-8 py-2 sm:py-4">
          <footer className="w-full text-center text-gray-500 text-xs sm:text-sm">
            <p>© {new Date().getFullYear()} 闪电测速 - 高性能网络测速工具</p>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default App;