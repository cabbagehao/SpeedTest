import React from 'react';
import { Globe, CheckCircle, AlertTriangle, DollarSign, Wifi, BarChart } from 'lucide-react';

const IspArticle: React.FC = () => {
  return (
    <article className="leading-relaxed">
      <p className="text-lg text-gray-700 mb-6">
        选择适合您需求的互联网服务提供商(ISP)对于获得良好的网络体验至关重要。本文将指导您如何评估和选择最佳的互联网服务提供商。
      </p>
      
      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4 flex items-center">
        <BarChart className="w-6 h-6 text-indigo-500 mr-2" />
        了解互联网连接类型
      </h2>
      
      <p className="mb-4">
        在比较ISP之前，了解不同的互联网连接类型及其优缺点非常重要：
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
          <h3 className="font-semibold text-indigo-800 mb-2">光纤宽带 (FTTH)</h3>
          <ul className="space-y-1 text-gray-700">
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>最快的家庭互联网选项 (1Gbps+)</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>上传和下载速度对称或接近对称</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>低延迟，适合游戏和视频通话</span>
            </li>
            <li className="flex items-start">
              <AlertTriangle className="w-4 h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>可能不是所有地区都可用</span>
            </li>
          </ul>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <h3 className="font-semibold text-blue-800 mb-2">有线宽带 (DOCSIS)</h3>
          <ul className="space-y-1 text-gray-700">
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>广泛可用，典型速度100-500Mbps</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>价格通常比光纤便宜</span>
            </li>
            <li className="flex items-start">
              <AlertTriangle className="w-4 h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>上传速度通常慢于下载速度</span>
            </li>
            <li className="flex items-start">
              <AlertTriangle className="w-4 h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>高峰时段可能拥堵</span>
            </li>
          </ul>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
          <h3 className="font-semibold text-purple-800 mb-2">5G/4G 家用宽带</h3>
          <ul className="space-y-1 text-gray-700">
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>无需物理连接，安装快捷</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>可在传统宽带不可用的地区使用</span>
            </li>
            <li className="flex items-start">
              <AlertTriangle className="w-4 h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>速度变化大，受天气和信号影响</span>
            </li>
            <li className="flex items-start">
              <AlertTriangle className="w-4 h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>通常有数据上限或高峰期限速</span>
            </li>
          </ul>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-2">DSL (铜线)</h3>
          <ul className="space-y-1 text-gray-700">
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>在大多数有电话线的地区可用</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>价格较为经济</span>
            </li>
            <li className="flex items-start">
              <AlertTriangle className="w-4 h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>速度较慢(5-100Mbps)，受距离影响</span>
            </li>
            <li className="flex items-start">
              <AlertTriangle className="w-4 h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>随着距离增加，性能明显下降</span>
            </li>
          </ul>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mt-10 mb-4 flex items-center">
        <Globe className="w-6 h-6 text-indigo-500 mr-2" />
        评估您的互联网需求
      </h2>
      
      <p className="mb-4">
        在选择ISP前，先评估您的家庭互联网需求是很重要的。考虑以下因素：
      </p>
      
      <div className="bg-gray-50 rounded-lg p-5 my-4">
        <ul className="space-y-4">
          <li className="flex">
            <Wifi className="w-5 h-5 text-indigo-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">设备数量</h4>
              <p className="text-gray-700">统计家中同时连接互联网的设备数量，包括手机、电脑、智能电视、智能音箱等。每增加5台活跃设备，建议网速至少增加25Mbps。</p>
            </div>
          </li>
          
          <li className="flex">
            <Globe className="w-5 h-5 text-indigo-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">使用习惯</h4>
              <p className="text-gray-700">考虑您的在线活动：基本浏览和电子邮件需要较低带宽；视频流媒体、大文件下载和多人在线游戏需要更高带宽。</p>
            </div>
          </li>
          
          <li className="flex">
            <BarChart className="w-5 h-5 text-indigo-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">上传需求</h4>
              <p className="text-gray-700">如果您需要上传大文件、进行视频通话或直播，应特别注意上传速度。光纤通常提供最佳上传性能。</p>
            </div>
          </li>
          
          <li className="flex">
            <DollarSign className="w-5 h-5 text-indigo-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">预算考虑</h4>
              <p className="text-gray-700">确定您每月愿意为互联网服务支付的金额。更高速度和无限流量计划通常价格更高。</p>
            </div>
          </li>
        </ul>
      </div>
      
      <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-400 my-6">
        <h3 className="font-medium text-indigo-800 mb-1">互联网速度建议参考</h3>
        <ul className="text-gray-700 space-y-1">
          <li>• 1-2人家庭，基本使用：25-50 Mbps</li>
          <li>• 2-4人家庭，中度使用：50-100 Mbps</li>
          <li>• 4人以上家庭，重度使用：100-500 Mbps</li>
          <li>• 专业直播、游戏或家庭办公：500+ Mbps</li>
        </ul>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mt-10 mb-4 flex items-center">
        <CheckCircle className="w-6 h-6 text-indigo-500 mr-2" />
        选择ISP时要考虑的关键因素
      </h2>
      
      <div className="space-y-6 mt-6">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-lg mb-2 text-gray-800">可用性</h3>
          <p className="text-gray-700 mb-2">
            首先确认您所在地区提供哪些ISP服务。在某些地区，选择可能有限。
          </p>
          <div className="text-sm text-indigo-600 font-medium">
            如何检查：输入您的地址在各大ISP官网上查询服务覆盖情况。
          </div>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-lg mb-2 text-gray-800">速度和带宽</h3>
          <p className="text-gray-700 mb-2">
            比较不同ISP提供的下载和上传速度。注意，宣传的速度通常是"最高可达"速度，实际可能较低。
          </p>
          <div className="text-sm text-indigo-600 font-medium">
            如何评估：查看独立速度测试网站的该ISP平均速度数据，或向邻居询问他们的实际体验。
          </div>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-lg mb-2 text-gray-800">价格和合同</h3>
          <p className="text-gray-700 mb-2">
            比较月费、设备费、安装费以及其他可能的额外费用。注意一些ISP提供首年优惠价格，之后会上调。
          </p>
          <div className="text-sm text-indigo-600 font-medium">
            如何节省：询问是否有任何促销或折扣，考虑自购路由器避免月租费，比较不同合同期限的价格差异。
          </div>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-lg mb-2 text-gray-800">数据上限和网络中立性</h3>
          <p className="text-gray-700 mb-2">
            一些ISP设有每月数据使用限制，超出后可能降速或额外收费。了解ISP是否对特定类型的流量（如视频流媒体或P2P）有限制或优先级调整。
          </p>
          <div className="text-sm text-indigo-600 font-medium">
            如何检查：阅读合同的细则，特别关注数据上限和流量管理政策。选择无上限或上限高的计划，特别是对于家庭多设备使用。
          </div>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-lg mb-2 text-gray-800">可靠性和客户服务</h3>
          <p className="text-gray-700 mb-2">
            考虑ISP的可靠性和宕机历史。良好的客户服务对于解决互联网问题至关重要。
          </p>
          <div className="text-sm text-indigo-600 font-medium">
            如何评估：查看在线评论，向邻居和朋友询问他们的经验，了解客户服务可用时间和联系方式。
          </div>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mt-10 mb-4 flex items-center">
        <AlertTriangle className="w-6 h-6 text-indigo-500 mr-2" />
        注意事项和潜在陷阱
      </h2>
      
      <div className="bg-amber-50 rounded-lg p-5 border-l-4 border-amber-400 my-6">
        <ul className="space-y-3">
          <li className="flex items-start">
            <AlertTriangle className="w-4 h-4 text-amber-600 mr-2 mt-1 flex-shrink-0" />
            <span><span className="font-medium">促销价格陷阱：</span>许多ISP提供吸引人的短期价格，但在合同期结束后大幅上涨。选择前了解所有时期的价格。</span>
          </li>
          <li className="flex items-start">
            <AlertTriangle className="w-4 h-4 text-amber-600 mr-2 mt-1 flex-shrink-0" />
            <span><span className="font-medium">捆绑服务：</span>电视和电话服务捆绑可能看起来划算，但如果您不需要这些服务，单独的互联网套餐可能更经济。</span>
          </li>
          <li className="flex items-start">
            <AlertTriangle className="w-4 h-4 text-amber-600 mr-2 mt-1 flex-shrink-0" />
            <span><span className="font-medium">合同终止费：</span>提前终止合同可能需要支付高额费用。如果您不确定会居住多久，考虑无合同选项。</span>
          </li>
          <li className="flex items-start">
            <AlertTriangle className="w-4 h-4 text-amber-600 mr-2 mt-1 flex-shrink-0" />
            <span><span className="font-medium">设备租赁费：</span>路由器和调制解调器的月租费会增加总成本。考虑购买自己的设备，长期使用更经济。</span>
          </li>
        </ul>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mt-10 mb-4">
        结论：做出明智的选择
      </h2>
      
      <p className="mb-3">
        选择ISP是一项重要决定，会直接影响您的日常在线体验。花时间研究、比较选项，并基于您的具体需求做出选择。
      </p>
      
      <p className="mb-6">
        记住，最贵的计划并不总是最适合您的。评估您实际需要的速度和功能，选择能够提供良好平衡的方案：足够的速度、可靠的服务、合理的价格以及满足您需求的数据限制。
      </p>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6">
        <p className="text-blue-800">
          <span className="font-semibold">最后建议：</span> 在签约前，尝试与当前使用该ISP的邻居交谈，了解实际体验。或者，查看是否有无需长期合约的选项，这样如果服务不满意，您可以更容易地更换提供商。
        </p>
      </div>
    </article>
  );
};

export default IspArticle; 