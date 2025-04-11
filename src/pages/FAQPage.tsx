import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

const FAQPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  
  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };
  
  const faqs: FAQItem[] = [
    {
      question: '什么是网速测试？',
      answer: (
        <div>
          <p>网速测试是一种测量您与互联网连接质量的工具。它测量几个关键指标：</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><span className="font-medium">下载速度</span>：数据从服务器传输到您的设备的速度，通常以Mbps(兆比特每秒)为单位。</li>
            <li><span className="font-medium">上传速度</span>：数据从您的设备传输到服务器的速度，也以Mbps为单位。</li>
            <li><span className="font-medium">ping值(延迟)</span>：数据往返于服务器所需的时间，以毫秒(ms)为单位。</li>
            <li><span className="font-medium">抖动</span>：网络延迟的变化程度，较低的抖动意味着更稳定的连接。</li>
            <li><span className="font-medium">丢包率</span>：传输过程中丢失的数据包百分比。</li>
          </ul>
        </div>
      )
    },
    {
      question: '我应该多久测试一次网速？',
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
      answer: (
        <div>
          <p>提高网速的常见方法：</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>重启您的调制解调器和路由器</li>
            <li>将设备放置在离路由器更近的位置</li>
            <li>减少同时连接的设备数量</li>
            <li>升级到更新的路由器，特别是支持Wi-Fi 6的路由器</li>
            <li>使用有线以太网连接而非WiFi</li>
            <li>联系您的ISP，看是否有网络问题或可以升级套餐</li>
            <li>检查是否有恶意软件或病毒消耗带宽</li>
          </ul>
        </div>
      )
    },
    {
      question: '什么是好的网速标准？',
      answer: (
        <div>
          <p>网速的好坏取决于您的使用场景：</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><span className="font-medium">基本浏览/电子邮件</span>：下载 5-10 Mbps，上传 1-2 Mbps，ping &lt; 100ms</li>
            <li><span className="font-medium">高清视频流</span>：下载 25+ Mbps，上传 3+ Mbps，ping &lt; 50ms</li>
            <li><span className="font-medium">4K视频流</span>：下载 35-40+ Mbps，上传 5+ Mbps，ping &lt; 50ms</li>
            <li><span className="font-medium">在线游戏</span>：下载 10+ Mbps，上传 3+ Mbps，ping &lt; 30ms，低抖动</li>
            <li><span className="font-medium">视频会议</span>：下载 10+ Mbps，上传 5+ Mbps，ping &lt; 50ms，低抖动</li>
            <li><span className="font-medium">大文件下载/上传</span>：下载 50+ Mbps，上传 10+ Mbps</li>
          </ul>
          <p className="mt-2">通常，对于现代多设备家庭，建议至少有 100 Mbps 的下载速度。</p>
        </div>
      )
    },
    {
      question: '为什么我的测试结果每次都不同？',
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
    }
  ];
  
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">常见问题 (FAQ)</h1>
      
      <div className="space-y-4">
        {faqs.map((faq, index) => (
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