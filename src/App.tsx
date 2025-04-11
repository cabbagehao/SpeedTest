import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SpeedTestPage from './pages/SpeedTestPage';
import FAQPage from './pages/FAQPage';
import LearnPage from './pages/LearnPage';
import LeaderboardPage from './pages/LeaderboardPage';
import Navigation from './components/Navigation';
import Footer from './components/layout/Footer';
import ThrottleTestButton from './components/ThrottleTestButton';

// 简单的页面组件
const PrivacyPage = () => (
  <div className="backdrop-blur-sm bg-white/50 rounded-2xl shadow-xl p-6 w-full">
    <h1 className="text-3xl font-bold text-gray-800 mb-6">隐私政策</h1>
    <div className="prose prose-indigo max-w-none">
      <p>我们非常重视您的隐私。本隐私政策说明了我们如何收集、使用和保护您的个人信息。</p>
      <h2>信息收集</h2>
      <p>当您使用我们的网速测试服务时，我们可能会收集以下信息：</p>
      <ul>
        <li>您的IP地址（仅用于确定地理位置和ISP信息）</li>
        <li>您的设备和浏览器信息</li>
        <li>网络测试结果数据</li>
      </ul>
      <h2>信息使用</h2>
      <p>我们收集的信息仅用于：</p>
      <ul>
        <li>提供网速测试服务</li>
        <li>改进我们的服务质量</li>
        <li>生成匿名的统计数据</li>
      </ul>
      <h2>信息保护</h2>
      <p>我们采取适当的数据收集、存储和处理措施，以防止未经授权的访问、更改、披露或销毁您的个人信息。</p>
      <h2>信息共享</h2>
      <p>我们不会出售、交易或出租用户的个人信息给第三方。我们可能会分享匿名的统计数据，但这些数据不会包含可识别个人身份的信息。</p>
      <h2>Cookie使用</h2>
      <p>我们使用Cookie来保存您的测试历史和偏好设置。您可以通过浏览器设置控制Cookie的使用。</p>
      <h2>隐私政策更新</h2>
      <p>我们可能会定期更新本隐私政策。建议您定期查看此页面以了解我们如何保护您的信息。</p>
    </div>
  </div>
);

const TermsPage = () => (
  <div className="backdrop-blur-sm bg-white/50 rounded-2xl shadow-xl p-6 w-full">
    <h1 className="text-3xl font-bold text-gray-800 mb-6">使用条款</h1>
    <div className="prose prose-indigo max-w-none">
      <p>欢迎使用我们的网速测试服务。请仔细阅读以下使用条款。</p>
      <h2>服务使用</h2>
      <p>我们的网速测试服务仅供个人和非商业用途使用。您同意不会：</p>
      <ul>
        <li>使用自动化工具或脚本大量访问我们的服务</li>
        <li>干扰或尝试破坏我们服务的正常运行</li>
        <li>将我们的服务用于任何非法或未经授权的目的</li>
      </ul>
      <h2>准确性声明</h2>
      <p>
        我们努力提供准确的网络测试结果，但测试结果可能受多种因素影响，包括但不限于您的设备性能、本地网络状况、互联网服务提供商的限制等。
        因此，我们不能保证测试结果的绝对准确性。
      </p>
      <h2>免责声明</h2>
      <p>我们的服务按"现状"提供，不附带任何明示或暗示的保证。在法律允许的最大范围内，我们不对因使用我们的服务而导致的任何直接、间接、附带、特殊或后果性损失承担责任。</p>
      <h2>服务变更</h2>
      <p>我们保留随时修改或终止服务的权利，恕不另行通知。我们对服务的任何修改、暂停或终止不承担责任。</p>
      <h2>条款更新</h2>
      <p>我们可能会定期更新这些使用条款。继续使用我们的服务即表示您接受当前的使用条款。</p>
    </div>
  </div>
);

const AboutPage = () => (
  <div className="backdrop-blur-sm bg-white/50 rounded-2xl shadow-xl p-6 w-full">
    <h1 className="text-3xl font-bold text-gray-800 mb-6">关于我们</h1>
    <div className="prose prose-indigo max-w-none">
      <p>
        我们是一支致力于为用户提供高质量网络测试工具的团队。我们的使命是帮助互联网用户更好地了解和优化他们的网络连接。
      </p>
      <h2>我们的服务</h2>
      <p>
        我们的网速测试工具提供全面的网络性能分析，包括下载速度、上传速度、网络延迟（ping）、抖动和丢包率测试。
        无论您是家庭用户、小型企业还是网络专业人士，我们的工具都能帮助您准确评估网络质量。
      </p>
      <h2>我们的技术</h2>
      <p>
        我们的网速测试采用现代Web技术构建，确保准确性和可靠性。我们持续优化测试算法，以提供最精确的网络性能指标。
      </p>
      <h2>我们的目标</h2>
      <ul>
        <li>提供简单易用且准确的网络测试工具</li>
        <li>帮助用户了解并改善他们的网络连接</li>
        <li>推动互联网服务提供商提升服务质量</li>
        <li>普及网络知识，帮助用户做出明智的网络选择</li>
      </ul>
      <h2>联系我们</h2>
      <p>
        如果您有任何问题、建议或反馈，欢迎通过以下方式联系我们：
      </p>
      <p>
        邮箱：support@speedtest-example.com
      </p>
      <p>
        我们感谢您使用我们的服务，并期待不断改进以满足您的需求。
      </p>
    </div>
  </div>
);

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
        
        {/* 页面级导航栏 - 背景透明 */}
        <div className="w-full sticky top-0 z-10 backdrop-blur-sm">
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
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/about" element={<AboutPage />} />
            </Routes>
          </div>
        </div>
        
        {/* 页脚 */}
        <div className="relative z-0">
          <div className="container mx-auto">
            <Footer />
          </div>
        </div>
        
        {/* 限速测试按钮（只在开发模式显示） */}
        <ThrottleTestButton />
      </div>
    </Router>
  );
}

export default App;