import React from 'react';
import { Map, BarChart2, Smartphone, Zap, Globe, AlertTriangle } from 'lucide-react';

const FiveGArticle: React.FC = () => {
  return (
    <article className="leading-relaxed">
      <p className="text-lg text-gray-700 mb-6">
        5G技术正在全球迅速部署，各国的5G网络性能和覆盖率存在显著差异。本文将探讨全球主要国家和地区的5G网络速度对比，以及影响这些差异的关键因素。
      </p>
      
      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4 flex items-center">
        <Zap className="w-6 h-6 text-indigo-500 mr-2" />
        5G技术简介与理论速度
      </h2>
      
      <p className="mb-4">
        5G是第五代移动通信技术，相比4G LTE，它提供了更高的速度、更低的延迟和更大的容量。从理论上讲，5G技术能够实现：
      </p>
      
      <div className="bg-indigo-50 rounded-lg p-5 my-4">
        <ul className="space-y-3">
          <li className="flex items-start">
            <Zap className="w-5 h-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium">最高下载速度：</span> 理论峰值可达10-20 Gbps（比4G快100倍）
            </div>
          </li>
          <li className="flex items-start">
            <Zap className="w-5 h-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium">延迟：</span> 低至1毫秒（4G为30-70毫秒）
            </div>
          </li>
          <li className="flex items-start">
            <Zap className="w-5 h-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium">连接密度：</span> 每平方公里可支持100万台设备连接
            </div>
          </li>
        </ul>
      </div>
      
      <p className="text-sm text-gray-500 italic mb-6">
        注：理论速度在实际使用中很少达到，实际性能受多种因素影响，如网络拥堵、距离和5G频段类型。
      </p>
      
      <h2 className="text-2xl font-bold text-gray-800 mt-10 mb-4 flex items-center">
        <Map className="w-6 h-6 text-indigo-500 mr-2" />
        全球5G速度排名
      </h2>
      
      <p className="mb-6">
        根据最新的全球移动网络测试数据，以下是各国5G网络的平均下载速度排名（数据会随时间变化）：
      </p>
      
      {/* 5G速度排名表格 */}
      <div className="overflow-x-auto mb-8">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">排名</th>
              <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">国家/地区</th>
              <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">平均下载速度</th>
              <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">相比4G提升</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr className="bg-yellow-50">
              <td className="py-3 px-4 text-sm font-semibold">1</td>
              <td className="py-3 px-4 text-sm">韩国</td>
              <td className="py-3 px-4 text-sm font-medium text-indigo-600">437.5 Mbps</td>
              <td className="py-3 px-4 text-sm">5.4倍</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-sm font-semibold">2</td>
              <td className="py-3 px-4 text-sm">挪威</td>
              <td className="py-3 px-4 text-sm font-medium text-indigo-600">426.7 Mbps</td>
              <td className="py-3 px-4 text-sm">6.9倍</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-sm font-semibold">3</td>
              <td className="py-3 px-4 text-sm">阿联酋</td>
              <td className="py-3 px-4 text-sm font-medium text-indigo-600">397.3 Mbps</td>
              <td className="py-3 px-4 text-sm">7.6倍</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-sm font-semibold">4</td>
              <td className="py-3 px-4 text-sm">中国</td>
              <td className="py-3 px-4 text-sm font-medium text-indigo-600">349.2 Mbps</td>
              <td className="py-3 px-4 text-sm">7.7倍</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-sm font-semibold">5</td>
              <td className="py-3 px-4 text-sm">沙特阿拉伯</td>
              <td className="py-3 px-4 text-sm font-medium text-indigo-600">338.1 Mbps</td>
              <td className="py-3 px-4 text-sm">6.3倍</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-sm font-semibold">6</td>
              <td className="py-3 px-4 text-sm">中国台湾</td>
              <td className="py-3 px-4 text-sm font-medium text-indigo-600">321.5 Mbps</td>
              <td className="py-3 px-4 text-sm">5.7倍</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-sm font-semibold">7</td>
              <td className="py-3 px-4 text-sm">芬兰</td>
              <td className="py-3 px-4 text-sm font-medium text-indigo-600">304.4 Mbps</td>
              <td className="py-3 px-4 text-sm">6.2倍</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-sm font-semibold">8</td>
              <td className="py-3 px-4 text-sm">新加坡</td>
              <td className="py-3 px-4 text-sm font-medium text-indigo-600">296.5 Mbps</td>
              <td className="py-3 px-4 text-sm">5.8倍</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-sm font-semibold">9</td>
              <td className="py-3 px-4 text-sm">泰国</td>
              <td className="py-3 px-4 text-sm font-medium text-indigo-600">277.4 Mbps</td>
              <td className="py-3 px-4 text-sm">7.5倍</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-sm font-semibold">10</td>
              <td className="py-3 px-4 text-sm">澳大利亚</td>
              <td className="py-3 px-4 text-sm font-medium text-indigo-600">265.5 Mbps</td>
              <td className="py-3 px-4 text-sm">5.9倍</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-sm font-semibold">...</td>
              <td className="py-3 px-4 text-sm">...</td>
              <td className="py-3 px-4 text-sm">...</td>
              <td className="py-3 px-4 text-sm">...</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-sm font-semibold">18</td>
              <td className="py-3 px-4 text-sm">日本</td>
              <td className="py-3 px-4 text-sm font-medium text-indigo-600">186.3 Mbps</td>
              <td className="py-3 px-4 text-sm">4.1倍</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-sm font-semibold">24</td>
              <td className="py-3 px-4 text-sm">美国</td>
              <td className="py-3 px-4 text-sm font-medium text-indigo-600">118.2 Mbps</td>
              <td className="py-3 px-4 text-sm">2.7倍</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-sm font-semibold">29</td>
              <td className="py-3 px-4 text-sm">英国</td>
              <td className="py-3 px-4 text-sm font-medium text-indigo-600">87.1 Mbps</td>
              <td className="py-3 px-4 text-sm">2.4倍</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <p className="text-sm text-gray-500 italic mb-8">
        数据来源：最新全球移动网络体验报告。数据会随时间推移而变化，表格中的数据为最近可得的平均值。
      </p>
      
      <h2 className="text-2xl font-bold text-gray-800 mt-10 mb-4 flex items-center">
        <BarChart2 className="w-6 h-6 text-indigo-500 mr-2" />
        区域对比分析
      </h2>
      
      <div className="space-y-6 mb-8">
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
            <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 mr-2">亚</span>
            亚洲地区
          </h3>
          <p className="text-gray-700 mb-3">
            亚洲在全球5G速度排名中占据主导地位，韩国、中国和新加坡位居前列。韩国作为第一个全国范围内推出5G的国家，持续在5G技术和覆盖范围方面领先。
          </p>
          <div className="text-sm text-gray-600">
            <strong>特点：</strong> 基础设施投资大，政府政策支持强，设备制造业发达，频谱分配合理
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
            <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2">欧</span>
            欧洲地区
          </h3>
          <p className="text-gray-700 mb-3">
            欧洲国家表现不一，北欧国家如挪威和芬兰表现突出，而西欧和南欧国家速度相对较慢。监管限制和频谱分配政策造成了区域内的差异。
          </p>
          <div className="text-sm text-gray-600">
            <strong>特点：</strong> 北欧领先，监管严格，运营商竞争激烈，频谱拍卖价格高
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
            <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-2">美</span>
            北美地区
          </h3>
          <p className="text-gray-700 mb-3">
            美国虽然在5G覆盖率方面表现不错，但在速度方面中等偏下，主要原因是其最初部署的是低频段5G，虽然覆盖广但速度不及中高频段。
          </p>
          <div className="text-sm text-gray-600">
            <strong>特点：</strong> 低频段部署优先，覆盖广但速度慢，毫米波仅限大城市，农村地区部署滞后
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
            <span className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 mr-2">中</span>
            中东地区
          </h3>
          <p className="text-gray-700 mb-3">
            阿联酋和沙特阿拉伯在全球5G速度排名中表现优异，主要受益于大规模基础设施投资和相对较少的监管障碍。
          </p>
          <div className="text-sm text-gray-600">
            <strong>特点：</strong> 大规模投资，高密度人口区部署完善，频谱资源丰富，城市智能化战略先行
          </div>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mt-10 mb-4 flex items-center">
        <Globe className="w-6 h-6 text-indigo-500 mr-2" />
        影响5G网速的关键因素
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-lg text-gray-800 mb-2">频谱分配</h3>
          <p className="text-gray-700">
            不同频段提供不同的特性：低频段(600-900MHz)覆盖广但速度慢；中频段(2.5-4.2GHz)平衡速度和覆盖；高频段/毫米波(24-40GHz)速度极快但覆盖小。国家间的频谱政策差异导致了性能差异。
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-lg text-gray-800 mb-2">基础设施密度</h3>
          <p className="text-gray-700">
            5G基站密度直接影响网络性能，特别是高频段需要更密集的基站部署。韩国和中国投入大量资源建设高密度网络，而其他国家出于成本考虑采用较低密度部署。
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-lg text-gray-800 mb-2">技术选择</h3>
          <p className="text-gray-700">
            是否使用独立组网(SA)或非独立组网(NSA)模式影响速度和延迟。SA模式完全基于5G核心网，性能最佳；NSA模式依赖现有4G核心网，速度较慢但部署快。
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-lg text-gray-800 mb-2">政策与投资</h3>
          <p className="text-gray-700">
            政府政策（如频谱拍卖、基础设施共享规定、外商投资限制）和电信运营商的投资策略直接影响5G部署速度和质量。
          </p>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mt-10 mb-4 flex items-center">
        <Smartphone className="w-6 h-6 text-indigo-500 mr-2" />
        现实中的5G体验
      </h2>
      
      <div className="bg-indigo-50 rounded-lg p-5 mb-8">
        <h3 className="font-semibold text-lg text-indigo-800 mb-3">不同场景的5G速度对比</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg">
            <thead className="bg-indigo-100">
              <tr>
                <th className="py-2 px-3 text-left text-xs font-medium text-indigo-800">使用场景</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-indigo-800">城市中心</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-indigo-800">郊区</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-indigo-800">农村地区</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-indigo-800">高峰时段影响</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-100">
              <tr>
                <td className="py-3 px-3 text-sm font-medium">韩国</td>
                <td className="py-3 px-3 text-sm">350-520 Mbps</td>
                <td className="py-3 px-3 text-sm">250-400 Mbps</td>
                <td className="py-3 px-3 text-sm">100-300 Mbps</td>
                <td className="py-3 px-3 text-sm">降低15-20%</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-sm font-medium">中国</td>
                <td className="py-3 px-3 text-sm">300-480 Mbps</td>
                <td className="py-3 px-3 text-sm">220-380 Mbps</td>
                <td className="py-3 px-3 text-sm">80-280 Mbps</td>
                <td className="py-3 px-3 text-sm">降低20-25%</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-sm font-medium">美国</td>
                <td className="py-3 px-3 text-sm">80-250 Mbps</td>
                <td className="py-3 px-3 text-sm">50-150 Mbps</td>
                <td className="py-3 px-3 text-sm">20-80 Mbps</td>
                <td className="py-3 px-3 text-sm">降低25-35%</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-sm font-medium">欧洲(平均)</td>
                <td className="py-3 px-3 text-sm">150-350 Mbps</td>
                <td className="py-3 px-3 text-sm">100-250 Mbps</td>
                <td className="py-3 px-3 text-sm">50-150 Mbps</td>
                <td className="py-3 px-3 text-sm">降低20-30%</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <p className="text-sm text-gray-600 mt-3">
          注：数据为一般情况下的典型范围，实际速度会根据具体位置、时间、设备和网络拥堵程度而有显著差异。
        </p>
      </div>
      
      <div className="bg-amber-50 rounded-lg p-5 border-l-4 border-amber-400 mb-8">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-amber-600 mr-2 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-amber-800 mb-1">宣传与现实的差距</h3>
            <p className="text-amber-700">
              运营商宣传的"高达"速度通常是理想条件下的峰值速度，实际日常使用中很少达到。在高峰时段、室内或人口密集区域，速度会显著降低。考虑真实测试中的平均速度而非理论峰值速度更为实际。
            </p>
          </div>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mt-10 mb-4">
        未来展望
      </h2>
      
      <p className="mb-4">
        随着5G技术的持续发展和基础设施的完善，全球5G网速将继续提升。几个主要趋势包括：
      </p>
      
      <ul className="list-disc list-inside space-y-2 mb-6 ml-2">
        <li>更多国家将部署独立组网(SA)5G，提供更高速度和更低延迟</li>
        <li>高频段/毫米波5G将在更多城市地区部署，极大提升局部速度</li>
        <li>先进的天线技术和网络切片将改善用户体验</li>
        <li>5G-Advanced和未来6G技术的研发将推动移动网速进一步提升</li>
      </ul>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6">
        <p className="text-blue-800">
          <span className="font-semibold">结论：</span> 全球5G速度差异反映了各国在技术选择、投资优先级和监管环境方面的不同策略。虽然亚洲国家目前引领5G速度，但随着技术成熟和更广泛部署，全球差距可能会缩小。无论如何，5G技术的广泛应用将持续改变我们的通信、工作和生活方式。
        </p>
      </div>
    </article>
  );
};

export default FiveGArticle; 