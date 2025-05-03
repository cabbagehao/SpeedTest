import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Zap, Download, Upload, Clock, Wifi, Layers, Shield, Server, Activity } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: React.ReactNode;
  category?: string;
}

const FAQPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };
  
  const categories = [
    { id: null, name: '全部问题' },
    { id: 'basic', name: '基础问题' },
    { id: 'technical', name: '技术细节' },
    { id: 'troubleshooting', name: '故障排除' },
    { id: 'optimization', name: '网络优化' }
  ];
  
  const faqs: FAQItem[] = [
    {
      question: '什么是网速测试？',
      category: 'basic',
      answer: (
        <div>
          <p>网速测试是通过在您的设备和测试服务器之间传输数据来衡量您的互联网连接性能的过程。它测量几个关键指标：</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><span className="font-medium">下载速度</span>：数据从服务器传输到您的设备的速度，通常以Mbps(兆比特每秒)为单位。</li>
            <li><span className="font-medium">上传速度</span>：数据从您的设备传输到服务器的速度，也以Mbps为单位。</li>
            <li><span className="font-medium">ping值(延迟)</span>：数据往返于服务器所需的时间，以毫秒(ms)为单位。</li>
            <li><span className="font-medium">抖动</span>：网络延迟的变化程度，较低的抖动意味着更稳定的连接。</li>
            <li><span className="font-medium">丢包率</span>：传输过程中丢失的数据包百分比。</li>
          </ul>
          
          <h3 className="font-semibold text-lg text-gray-800 mt-4 mb-2">网速测试的工作原理</h3>
          <p>当您启动网速测试时，发生了以下过程：</p>
          <ol className="list-decimal list-inside space-y-1 my-2 ml-2">
            <li><span className="font-medium">初始连接</span>：您的设备与距离最近的测速服务器建立连接。</li>
            <li><span className="font-medium">延迟测试</span>：多次发送小数据包以测量ping值和抖动。</li>
            <li><span className="font-medium">下载测试</span>：服务器向您的设备发送数据块，测量传输速率。</li>
            <li><span className="font-medium">上传测试</span>：您的设备向服务器发送数据，测量上传速率。</li>
            <li><span className="font-medium">结果计算</span>：基于收集的数据计算最终测量值，并显示结果。</li>
          </ol>
        </div>
      )
    },
    {
      question: '我应该多久测试一次网速？',
      category: 'basic',
      answer: (
        <div>
          <p>建议在以下情况下测试网速：</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>当您感觉互联网连接速度变慢时</li>
            <li>在安装新的互联网服务后</li>
            <li>更换或升级路由器后</li>
            <li>在家中不同位置，以检查WiFi覆盖情况</li>
            <li>在不同时间段(早晨、下午、晚上)进行测试，了解高峰时段情况</li>
          </ul>
        </div>
      )
    },
    {
      question: '为什么测试结果会与我的网络套餐速度不符？',
      category: 'basic',
      answer: (
        <div>
          <p>网速测试结果可能与您的网络套餐宣传速度不同，原因包括：</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>互联网服务提供商(ISP)通常宣传"最高可达"速度，而非保证速度</li>
            <li>家庭网络中的多个设备同时使用网络会分散带宽</li>
            <li>WiFi信号强度、路由器性能和位置都会影响实际速度</li>
            <li>网络拥堵，特别是在高峰使用时段</li>
            <li>测试服务器的位置和负载情况</li>
          </ul>
        </div>
      )
    },
    {
      question: '如何提高我的网络速度？',
      category: 'optimization',
      answer: (
        <div>
          <p>提高网速的常见方法：</p>
          <ul className="list-disc list-inside mt-2 space-y-1 mb-3">
            <li>重启您的调制解调器和路由器</li>
            <li>将设备放置在离路由器更近的位置</li>
            <li>减少同时连接的设备数量</li>
            <li>升级到更新的路由器，特别是支持Wi-Fi 6的路由器</li>
            <li>使用有线以太网连接而非WiFi</li>
            <li>联系您的ISP，看是否有网络问题或可以升级套餐</li>
            <li>检查是否有恶意软件或病毒消耗带宽</li>
          </ul>
          
          <h3 className="font-semibold text-lg text-gray-800 mb-2">路由器优化</h3>
          <ul className="list-disc list-inside space-y-1 mb-3">
            <li>将路由器放在中心位置，远离墙壁和障碍物</li>
            <li>使用WiFi分析器应用查找最不拥挤的信道</li>
            <li>可能的话，尽量使用5GHz频段</li>
            <li>保持路由器远离其他电子设备</li>
            <li>更新路由器固件到最新版本</li>
          </ul>
        </div>
      )
    },
    {
      question: '什么是好的网速标准？',
      category: 'basic',
      answer: (
        <div>
          <p>网速的好坏取决于您的使用场景：</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><span className="font-medium">基本浏览/电子邮件</span>：下载 5-10 Mbps，上传 1-2 Mbps，ping &lt; 100ms</li>
            <li><span className="font-medium">高清视频流</span>：下载 25+ Mbps，上传 3+ Mbps，ping &lt; 50ms</li>
            <li><span className="font-medium">4K视频流</span>：下载 35-40+ Mbps，上传 5+ Mbps，ping &lt; 50ms</li>
            <li><span className="font-medium">在线游戏</span>：下载 10+ Mbps，上传 3+ Mbps，ping &lt; 30ms，低抖动</li>
            <li><span className="font-medium">远程办公</span>：下载 10+ Mbps，上传 5+ Mbps，ping &lt; 50ms，低抖动</li>
            <li><span className="font-medium">大文件下载/上传</span>：下载 50+ Mbps，上传 10+ Mbps</li>
          </ul>
          <p className="mt-2">通常，对于现代多设备家庭，建议至少有 100 Mbps 的下载速度。</p>
        </div>
      )
    },
    {
      question: '为什么我的测试结果每次都不同？',
      category: 'troubleshooting',
      answer: (
        <div>
          <p>测速结果波动是正常的，可能因以下因素而异：</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>网络使用高峰时段的拥堵</li>
            <li>您连接的测速服务器不同</li>
            <li>测试时有其他应用/设备正在使用网络</li>
            <li>WiFi干扰和信号强度变化</li>
            <li>ISP的网络调节(traffic shaping)或节流(throttling)政策</li>
          </ul>
          <p className="mt-2">建议多次测试并取平均值，以获得更准确的结果。</p>
        </div>
      )
    },
    {
      question: '手机和电脑测速结果为什么会不同？',
      category: 'technical',
      answer: (
        <div>
          <p>手机和电脑的测速结果可能存在差异，原因包括：</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>硬件能力不同（网络适配器、处理能力）</li>
            <li>连接方式不同（2.4GHz vs 5GHz WiFi，或有线连接）</li>
            <li>设备与路由器之间的距离和障碍物</li>
            <li>操作系统和网络驱动程序的优化不同</li>
            <li>移动设备可能受到运营商的限制和管理政策影响</li>
          </ul>
        </div>
      )
    },
    {
      question: '丢包率高是什么原因？如何解决？',
      category: 'troubleshooting',
      answer: (
        <div>
          <p>高丢包率（通常超过1%）可能由以下原因导致：</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>网络拥塞或过载</li>
            <li>WiFi信号干扰或信号弱</li>
            <li>硬件问题（老旧或损坏的路由器/调制解调器）</li>
            <li>网络电缆损坏</li>
            <li>ISP网络问题</li>
          </ul>
          <p className="mt-2 mb-1">解决方案：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>重启网络设备</li>
            <li>检查并更换可疑的网络电缆</li>
            <li>减少WiFi信道拥堵，或更改WiFi信道</li>
            <li>使用有线连接代替WiFi</li>
            <li>联系ISP报告问题</li>
          </ul>
        </div>
      )
    },
    {
      question: '如何选择最佳的互联网服务提供商(ISP)？',
      category: 'optimization',
      answer: (
        <div>
          <p>选择ISP时应考虑以下因素：</p>
          <ul className="list-disc list-inside mt-2 space-y-1 mb-3">
            <li><span className="font-medium">可用性</span>：确认服务提供商在您的区域提供服务</li>
            <li><span className="font-medium">速度选项</span>：查看提供的下载和上传速度</li>
            <li><span className="font-medium">价格</span>：比较不同服务商的价格，注意合同期和促销价格后的常规价格</li>
            <li><span className="font-medium">数据上限</span>：了解是否有每月数据使用限制</li>
            <li><span className="font-medium">连接类型</span>：光纤、有线、DSL各有优缺点</li>
            <li><span className="font-medium">客户评价</span>：通过在线评价了解其他用户的体验</li>
          </ul>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="font-medium text-blue-800 mb-2">选择ISP的实用建议：</p>
            <ul className="list-disc list-inside text-blue-800 text-sm">
              <li>询问邻居他们使用的服务和体验</li>
              <li>检查服务合同细则，了解隐藏费用</li>
              <li>确认是否需要额外租用或购买设备</li>
              <li>了解服务质量保证和故障处理时间</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      question: '网络延迟和抖动是什么？为什么它们很重要？',
      category: 'technical',
      answer: (
        <div>
          <h3 className="font-semibold text-lg text-gray-800 mb-2">网络延迟(Ping)</h3>
          <p className="mb-3">网络延迟是数据从您的设备到目标服务器再返回所需的时间，以毫秒(ms)为单位。较低的延迟表示连接更快速响应。</p>
          
          <h3 className="font-semibold text-lg text-gray-800 mb-2">网络抖动(Jitter)</h3>
          <p className="mb-3">抖动是网络延迟变化的度量。较低的抖动值表示连接更稳定，延迟波动较小。</p>
          
          <p className="font-medium mb-2">为什么它们很重要：</p>
          <ul className="list-disc list-inside space-y-1 mb-3">
            <li><span className="font-medium">在线游戏</span>：低延迟和抖动对游戏响应至关重要</li>
            <li><span className="font-medium">视频通话</span>：高抖动会导致通话卡顿和音视频不同步</li>
            <li><span className="font-medium">流媒体</span>：不稳定的连接会导致缓冲和质量降低</li>
            <li><span className="font-medium">实时应用</span>：延迟影响实时应用的响应速度</li>
          </ul>
          
          <p className="font-medium mb-2">优化延迟和抖动的方法：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>使用有线连接代替WiFi</li>
            <li>选择距离更近的服务器</li>
            <li>关闭后台高带宽程序</li>
            <li>使用QoS(服务质量)设置优先处理关键应用</li>
          </ul>
        </div>
      )
    },
    {
      question: '影响我网速的主要因素有哪些？',
      category: 'technical',
      answer: (
        <div>
          <p className="mb-3">影响网速的因素可分为以下几类：</p>
          
          <h3 className="font-semibold text-lg text-gray-800 mb-2">网络基础设施因素</h3>
          <ul className="list-disc list-inside space-y-1 mb-3">
            <li><span className="font-medium">互联网服务类型</span>：光纤通常比DSL或有线更快</li>
            <li><span className="font-medium">订阅的速度套餐</span>：您支付的服务级别</li>
            <li><span className="font-medium">网络拥堵</span>：高峰时段可能会降低速度</li>
            <li><span className="font-medium">ISP节流政策</span>：提供商可能限制某些类型的流量</li>
          </ul>
          
          <h3 className="font-semibold text-lg text-gray-800 mb-2">家庭网络设置</h3>
          <ul className="list-disc list-inside space-y-1 mb-3">
            <li><span className="font-medium">路由器性能和位置</span>：老旧或位置不良的路由器会限制速度</li>
            <li><span className="font-medium">WiFi干扰</span>：邻居网络、家用电器可能造成干扰</li>
            <li><span className="font-medium">信道拥堵</span>：特别是在2.4GHz频段</li>
            <li><span className="font-medium">连接方式</span>：有线通常比无线稳定且快</li>
          </ul>
          
          <h3 className="font-semibold text-lg text-gray-800 mb-2">设备和软件</h3>
          <ul className="list-disc list-inside space-y-1">
            <li><span className="font-medium">设备能力</span>：老旧设备可能不支持更高速率</li>
            <li><span className="font-medium">同时连接数</span>：多设备共享带宽会降低单个设备速度</li>
            <li><span className="font-medium">后台进程</span>：更新、备份等消耗带宽</li>
            <li><span className="font-medium">浏览器扩展和插件</span>：某些扩展可能影响性能</li>
          </ul>
        </div>
      )
    },
    {
      question: '如何获得最准确的测试结果？',
      category: 'optimization',
      answer: (
        <div>
          <p className="mb-3">为获得最准确的网速测试结果，请遵循这些最佳实践：</p>
          
          <ul className="list-disc list-inside space-y-1 mb-4">
            <li>使用有线以太网连接而非WiFi进行测试（如果可能）</li>
            <li>关闭或暂停其他设备上的下载、流媒体和在线活动</li>
            <li>关闭VPN或代理，它们可能会限制速度</li>
            <li>清除浏览器缓存或使用隐私模式</li>
            <li>在不同时间（包括高峰和非高峰时段）进行多次测试</li>
            <li>尝试使用不同的测速服务进行交叉验证</li>
            <li>确保您的设备没有进行操作系统更新或云备份</li>
          </ul>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="font-medium text-blue-800 mb-2">专家提示：</p>
            <p className="text-blue-800 text-sm">考虑创建网速测试日志，记录不同时间和位置的测试结果。随着时间推移，这可以帮助您识别模式并更好地了解您的网络表现。</p>
          </div>
        </div>
      )
    },
    {
      question: '全球5G网络速度如何？中国5G水平如何？',
      category: 'technical',
      answer: (
        <div>
          <p className="mb-3">全球5G网络速度各不相同，受到多种因素影响：</p>
          
          <h3 className="font-semibold text-lg text-gray-800 mb-2">全球5G速度比较</h3>
          <ul className="list-disc list-inside space-y-1 mb-3">
            <li>韩国：平均下载速度约450-500 Mbps，覆盖率较高</li>
            <li>美国：平均下载速度约60-120 Mbps，视地区和运营商而异</li>
            <li>欧洲：平均下载速度约150-250 Mbps，发展程度不一</li>
            <li>中国：平均下载速度约300-350 Mbps，拥有全球最大5G网络</li>
          </ul>
          
          <h3 className="font-semibold text-lg text-gray-800 mb-2">中国5G网络优势</h3>
          <ul className="list-disc list-inside space-y-1 mb-3">
            <li>大规模部署：中国已建成超过100万个5G基站，全球占比超过70%</li>
            <li>高性价比：相比其他国家，中国5G资费较为亲民</li>
            <li>广泛覆盖：不仅限于大城市，中小城市也有较好覆盖</li>
            <li>应用场景丰富：工业互联网、智慧城市等领域广泛应用</li>
          </ul>
          
          <p className="text-sm text-gray-600 italic">注：数据基于2023年统计，实际速度会随时间、地点和网络负载变化。</p>
        </div>
      )
    }
  ];
  
  // 根据当前选中的分类过滤问题
  const filteredFaqs = activeCategory 
    ? faqs.filter(faq => faq.category === activeCategory)
    : faqs;
  
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">知识中心 & 常见问题</h1>
      
      {/* 分类标签 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(category => (
          <button
            key={category.id || 'all'}
            onClick={() => setActiveCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm ${
              activeCategory === category.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
      
      <div className="space-y-4">
        {filteredFaqs.map((faq, index) => (
          <div 
            key={index}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              className={`w-full px-6 py-4 text-left flex justify-between items-center ${
                openIndex === index ? 'bg-indigo-50' : 'bg-white'
              }`}
              onClick={() => toggleFAQ(index)}
            >
              <span className="font-medium text-lg text-gray-800">{faq.question}</span>
              {openIndex === index ? 
                <ChevronUp className="w-5 h-5 text-indigo-600" /> : 
                <ChevronDown className="w-5 h-5 text-gray-600" />
              }
            </button>
            {openIndex === index && (
              <div className="px-6 py-4 bg-white text-gray-700 leading-relaxed">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQPage;