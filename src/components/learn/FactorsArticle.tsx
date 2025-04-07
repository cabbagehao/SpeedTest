import React from 'react';
import { Wifi, Layers, Server, Activity, Shield } from 'lucide-react';

const FactorsArticle: React.FC = () => {
  return (
    <article className="leading-relaxed">
      <p className="text-lg text-gray-700 mb-6">
        在当今高度互联的世界中，良好的互联网速度对于几乎所有在线活动都至关重要。然而，多种因素可能会影响您的网络性能。本文将探讨影响网速的主要因素，并提供实用的解决方案。
      </p>
      
      <div className="space-y-8">
        {/* 网络基础设施因素 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <Server className="w-6 h-6 text-indigo-500 mr-2" />
            网络基础设施因素
          </h2>
          
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-xl mb-3">互联网服务类型</h3>
            <p className="mb-4">您使用的互联网连接类型直接影响最高可达速度：</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="border border-gray-200 rounded p-3">
                <h4 className="font-medium">光纤（FTTH/FTTP）</h4>
                <p className="text-sm text-gray-600">最快的选择，典型速度可达 1Gbps 或更高</p>
                <p className="text-xs text-indigo-600 mt-1">✓ 适合重度用户和多设备家庭</p>
              </div>
              
              <div className="border border-gray-200 rounded p-3">
                <h4 className="font-medium">有线（DOCSIS）</h4>
                <p className="text-sm text-gray-600">通常提供 100-500Mbps 下载速度</p>
                <p className="text-xs text-indigo-600 mt-1">✓ 适合普通家庭，性价比高</p>
              </div>
              
              <div className="border border-gray-200 rounded p-3">
                <h4 className="font-medium">DSL（铜线）</h4>
                <p className="text-sm text-gray-600">速度范围为 5-100Mbps，受距离影响</p>
                <p className="text-xs text-orange-600 mt-1">⚠ 受电话交换机距离限制</p>
              </div>
              
              <div className="border border-gray-200 rounded p-3">
                <h4 className="font-medium">5G/4G 移动网络</h4>
                <p className="text-sm text-gray-600">5G可达 1Gbps，4G约 20-100Mbps</p>
                <p className="text-xs text-orange-600 mt-1">⚠ 受位置和网络拥堵影响</p>
              </div>
            </div>
            
            <h3 className="font-semibold text-xl mt-6 mb-3">网络拥堵</h3>
            <p className="mb-2">尤其在高峰时段，当许多用户同时使用网络时，速度会下降：</p>
            <ul className="list-disc list-inside space-y-1 mb-3">
              <li>傍晚时段（19:00-23:00）通常是家庭网络的高峰期</li>
              <li>工作日白天是企业网络的高峰期</li>
              <li>大型内容发布（如游戏更新、热门剧集上线）可能导致区域性拥堵</li>
            </ul>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 text-blue-800">
              <p className="font-medium">解决方案：</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>考虑升级到商用级别的互联网计划，获取优先带宽</li>
                <li>在非高峰时段安排大型下载或备份</li>
                <li>联系ISP询问是否有网络升级计划</li>
              </ul>
            </div>
          </div>
        </section>
        
        {/* 家庭网络设置 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <Wifi className="w-6 h-6 text-indigo-500 mr-2" />
            家庭网络设置
          </h2>
          
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-xl mb-3">路由器性能和位置</h3>
            <p className="mb-4">您的路由器是家庭网络的中心，其性能和位置至关重要：</p>
            
            <div className="grid grid-cols-1 gap-4 mb-5">
              <div className="border border-gray-200 rounded p-3">
                <h4 className="font-medium">老旧路由器（4+ 年）</h4>
                <p className="text-sm text-gray-600">较旧的路由器可能仅支持802.11n或更早标准，限制速度一般在100-300Mbps</p>
                <p className="text-xs text-red-600 mt-1">✗ 可能成为网络瓶颈，即使有高速互联网连接</p>
              </div>
              
              <div className="border border-gray-200 rounded p-3">
                <h4 className="font-medium">位置不当</h4>
                <p className="text-sm text-gray-600">墙壁、地板、大型家电和其他障碍物会显著削弱WiFi信号</p>
                <p className="text-xs text-red-600 mt-1">✗ 会导致信号死角和不稳定连接</p>
              </div>
            </div>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 text-blue-800 mb-6">
              <p className="font-medium">解决方案：</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>升级到支持WiFi 6（802.11ax）的现代路由器</li>
                <li>将路由器放在中心位置，远离墙壁和障碍物</li>
                <li>考虑使用网格WiFi系统扩展覆盖范围</li>
                <li>对于关键设备，使用有线以太网连接</li>
              </ul>
            </div>
            
            <h3 className="font-semibold text-xl mb-3">WiFi干扰和拥堵</h3>
            <p className="mb-3">尤其在人口密集区域，WiFi信道可能非常拥挤：</p>
            <ul className="list-disc list-inside space-y-1 mb-3">
              <li>2.4GHz频段（更长距离，但更拥挤）</li>
              <li>5GHz频段（更短距离，但干扰较少）</li>
              <li>家用电器，如微波炉，可能干扰WiFi信号</li>
            </ul>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 text-blue-800">
              <p className="font-medium">解决方案：</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>使用WiFi分析器应用查找最不拥挤的信道</li>
                <li>可能的话，尽量使用5GHz频段</li>
                <li>保持路由器远离其他电子设备</li>
                <li>考虑WiFi 6路由器，它改善了拥挤环境下的性能</li>
              </ul>
            </div>
          </div>
        </section>
        
        {/* 设备和软件问题 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <Layers className="w-6 h-6 text-indigo-500 mr-2" />
            设备和软件问题
          </h2>
          
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-xl mb-3">设备限制</h3>
            <p className="mb-3">您的设备本身可能无法支持高速互联网：</p>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li>老旧的网络适配器可能限制速度</li>
              <li>CPU性能不足可能限制网络处理能力</li>
              <li>某些廉价设备可能有硬件限制</li>
            </ul>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 text-blue-800 mb-6">
              <p className="font-medium">解决方案：</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>考虑升级老旧设备或其无线网卡</li>
                <li>确保设备驱动程序是最新的</li>
                <li>检查设备规格，了解其网络能力上限</li>
              </ul>
            </div>
            
            <h3 className="font-semibold text-xl mb-3">软件和后台进程</h3>
            <p className="mb-3">运行中的程序可能消耗大量带宽：</p>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li>云同步软件（OneDrive, Dropbox等）</li>
              <li>自动更新（Windows, MacOS, 游戏客户端）</li>
              <li>恶意软件或未授权下载</li>
            </ul>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 text-blue-800">
              <p className="font-medium">解决方案：</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>使用任务管理器或活动监视器检查网络使用情况</li>
                <li>安排更新在非高峰时段进行</li>
                <li>扫描病毒和恶意软件</li>
                <li>限制同步软件的上传/下载速度</li>
              </ul>
            </div>
          </div>
        </section>
        
        {/* 安全和隐私影响 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <Shield className="w-6 h-6 text-indigo-500 mr-2" />
            安全和隐私因素
          </h2>
          
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-xl mb-3">VPN和加密</h3>
            <p className="mb-3">虽然VPN保护您的隐私，但也会影响速度：</p>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li>加密/解密过程需要额外处理时间</li>
              <li>VPN服务器可能距离较远，增加延迟</li>
              <li>一些低质量VPN服务有严格的带宽限制</li>
            </ul>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 text-blue-800 mb-6">
              <p className="font-medium">解决方案：</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>选择优质VPN服务，提供更多服务器选择</li>
                <li>连接到最近的VPN服务器</li>
                <li>需要速度时临时禁用VPN（非敏感活动）</li>
                <li>使用分流功能，只对需要保护的流量使用VPN</li>
              </ul>
            </div>
            
            <h3 className="font-semibold text-xl mb-3">未授权使用</h3>
            <p className="mb-3">他人可能在未经许可的情况下使用您的网络：</p>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li>WiFi密码被破解或分享</li>
              <li>邻居或路人使用您的网络</li>
              <li>IoT设备消耗意外带宽</li>
            </ul>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 text-blue-800">
              <p className="font-medium">解决方案：</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>使用强WiFi密码并定期更改</li>
                <li>启用WPA3加密（如果可用）</li>
                <li>在路由器设置中查看连接的设备</li>
                <li>考虑启用MAC地址过滤</li>
                <li>为访客设置单独的WiFi网络</li>
              </ul>
            </div>
          </div>
        </section>
        
        {/* 监测与故障排除 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <Activity className="w-6 h-6 text-indigo-500 mr-2" />
            监测与故障排除
          </h2>
          
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="mb-4">持续监测您的网络性能可以帮助及早发现问题：</p>
            
            <h3 className="font-semibold text-lg mb-2">基本故障排除步骤</h3>
            <ol className="list-decimal list-inside space-y-1 mb-4">
              <li>重启路由器和调制解调器（解决大约80%的常见问题）</li>
              <li>进行多次网速测试，不同时间和设备</li>
              <li>临时禁用所有不必要的设备，测试是否有改善</li>
              <li>检查所有物理连接和电缆</li>
              <li>更新路由器固件和设备驱动程序</li>
            </ol>
            
            <h3 className="font-semibold text-lg mb-2">高级故障排除</h3>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li>使用ping和traceroute命令识别连接问题</li>
              <li>检查DNS设置，考虑使用更快的DNS服务</li>
              <li>监测路由器CPU和内存使用率</li>
              <li>查看路由器日志寻找错误或警告</li>
            </ul>
            
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
              <h3 className="font-semibold text-lg text-indigo-800 mb-2">专业建议</h3>
              <p className="mb-2">如果所有故障排除步骤都无法解决问题：</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>联系您的ISP，请求技术支持</li>
                <li>请求ISP远程诊断您的连接</li>
                <li>考虑预约技术人员上门服务</li>
                <li>查询您所在地区是否有已知的服务中断</li>
              </ol>
            </div>
          </div>
        </section>
      </div>
      
      <div className="mt-8 p-5 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-bold text-blue-900 mb-3">结论</h2>
        <p className="text-blue-800">
          了解影响网速的因素是优化您的互联网体验的第一步。通过系统地检查和解决这些问题，您可以显著提高网络性能。记住，有时候问题可能不在您的控制范围内，如ISP基础设施限制，但大多数家庭网络问题都可以通过适当的设备、配置和维护来解决。
        </p>
      </div>
    </article>
  );
};

export default FactorsArticle; 