import React, { useState } from 'react';
import { PlayCircle, Gamepad2, Server, Zap, Network } from 'lucide-react';
import { testGameLatency, getGameLatencyAssessment } from '../services/gameLatencyTest';
import { GameLatencyTestResult } from '../services/speedTestTypes';

const GameLatencyTestPage: React.FC = () => {
  // 网络参数
  const [ping, setPing] = useState<number>(30);
  const [jitter, setJitter] = useState<number>(10);
  const [packetLoss, setPacketLoss] = useState<number>(0.5);
  
  // 游戏类型选择
  const [selectedGameType, setSelectedGameType] = useState<'FPS' | 'MOBA' | 'MMO' | 'CASUAL'>('FPS');
  
  // 测试状态
  const [testProgress, setTestProgress] = useState<number>(0);
  const [testStage, setTestStage] = useState<string>('');
  const [testing, setTesting] = useState<boolean>(false);
  
  // 测试结果
  const [gameLatencyResult, setGameLatencyResult] = useState<GameLatencyTestResult | null>(null);
  
  // 游戏类型信息
  const gameTypeInfo = {
    FPS: {
      name: '射击游戏 (FPS)',
      examples: 'CS:GO, Valorant, Apex Legends',
      description: '第一人称射击游戏要求极低的延迟和极高的稳定性，对网络质量非常敏感。',
      idealPing: '小于50ms',
      idealJitter: '小于10ms'
    },
    MOBA: {
      name: '多人在线竞技 (MOBA)',
      examples: 'DOTA2, 英雄联盟, 王者荣耀',
      description: '多人在线战术竞技游戏需要较低的延迟，但比FPS游戏更为宽容。',
      idealPing: '小于80ms',
      idealJitter: '小于20ms'
    },
    MMO: {
      name: '大型多人在线 (MMO)',
      examples: '魔兽世界, 最终幻想14, 黑色沙漠',
      description: '大型多人在线游戏可以接受中等延迟，但仍需要稳定的连接。',
      idealPing: '小于120ms',
      idealJitter: '小于30ms'
    },
    CASUAL: {
      name: '休闲游戏',
      examples: '卡牌游戏, 回合制游戏',
      description: '休闲游戏通常对网络延迟不太敏感，可以在较高延迟环境下正常游玩。',
      idealPing: '小于150ms',
      idealJitter: '小于50ms'
    }
  };
  
  // 进度回调函数
  const onProgressUpdate = (progress: number, stage: string) => {
    setTestProgress(progress);
    setTestStage(stage);
  };
  
  // 开始游戏延迟测试
  const runGameLatencyTest = async () => {
    setTesting(true);
    setGameLatencyResult(null);
    setTestProgress(0);
    setTestStage('准备测试');
    
    try {
      const result = await testGameLatency(ping, onProgressUpdate);
      setGameLatencyResult(result);
    } catch (error) {
      console.error('游戏延迟测试失败:', error);
    } finally {
      setTesting(false);
    }
  };
  
  // 获取当前状态的评级图标
  const getStatusIcon = (value: number, thresholds: {good: number, medium: number}) => {
    if (value <= thresholds.good) {
      return <div className="w-3 h-3 rounded-full bg-green-500"></div>;
    } else if (value <= thresholds.medium) {
      return <div className="w-3 h-3 rounded-full bg-yellow-500"></div>;
    } else {
      return <div className="w-3 h-3 rounded-full bg-red-500"></div>;
    }
  };
  
  const currentGameInfo = gameTypeInfo[selectedGameType];
  
  return (
    <div className="flex flex-col space-y-8">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
        游戏延迟测试
      </h1>
      <p className="text-center text-gray-600 mb-6">
        测试您的网络是否适合各类游戏，评估游戏体验质量
      </p>
      
      {/* 参数设置 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">网络参数设置</h2>
        <p className="text-sm text-gray-500 mb-4">设置您的网络参数或使用实际测速结果，以获得更准确的游戏延迟测试</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">延迟 (ms)</label>
            <input 
              type="number" 
              min="1" 
              step="1"
              value={ping}
              onChange={(e) => setPing(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">抖动 (ms)</label>
            <input 
              type="number" 
              min="0" 
              step="1"
              value={jitter}
              onChange={(e) => setJitter(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">丢包率 (%)</label>
            <input 
              type="number" 
              min="0" 
              max="100" 
              step="0.1"
              value={packetLoss}
              onChange={(e) => setPacketLoss(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">游戏类型</label>
            <select
              value={selectedGameType}
              onChange={(e) => setSelectedGameType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="FPS">射击游戏 (FPS)</option>
              <option value="MOBA">多人在线竞技 (MOBA)</option>
              <option value="MMO">大型多人在线 (MMO)</option>
              <option value="CASUAL">休闲游戏</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* 游戏类型信息卡片 */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Gamepad2 className="w-6 h-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">{currentGameInfo.name}</h3>
          </div>
          
          <p className="text-gray-600 mb-4">{currentGameInfo.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center text-gray-700">
                <Server className="w-4 h-4 mr-2 text-green-600" />
                <span className="font-medium">推荐游戏:</span>
              </div>
              <p className="text-gray-600 text-sm mt-1">{currentGameInfo.examples}</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center text-gray-700">
                <Zap className="w-4 h-4 mr-2 text-green-600" />
                <span className="font-medium">网络需求:</span>
              </div>
              <div className="text-gray-600 text-sm mt-1 space-y-1">
                <div>理想延迟: {currentGameInfo.idealPing}</div>
                <div>理想抖动: {currentGameInfo.idealJitter}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 测试卡片 */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Network className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">游戏延迟测试</h3>
          </div>
          <p className="text-gray-600 mb-6">
            本测试将模拟游戏数据包在多个游戏服务器之间的传输，评估您的网络延迟、抖动和丢包情况，
            并给出针对不同游戏类型的网络质量评估。
          </p>
          
          {testing ? (
            <div className="space-y-3 mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${testProgress}%` }}></div>
              </div>
              <p className="text-sm text-gray-600">{testStage} ({Math.round(testProgress)}%)</p>
            </div>
          ) : gameLatencyResult ? (
            <div className="space-y-4">
              <div className="flex flex-col space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">平均延迟:</span>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">
                      {Math.round(gameLatencyResult.averagePing)} ms
                    </span>
                    {getStatusIcon(gameLatencyResult.averagePing, {
                      good: selectedGameType === 'FPS' ? 50 : selectedGameType === 'MOBA' ? 80 : selectedGameType === 'MMO' ? 120 : 150,
                      medium: selectedGameType === 'FPS' ? 100 : selectedGameType === 'MOBA' ? 150 : selectedGameType === 'MMO' ? 200 : 250
                    })}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">抖动:</span>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">
                      {Math.round(gameLatencyResult.jitter)} ms
                    </span>
                    {getStatusIcon(gameLatencyResult.jitter, {good: 15, medium: 40})}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">丢包率:</span>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">
                      {gameLatencyResult.packetLoss}%
                    </span>
                    {getStatusIcon(gameLatencyResult.packetLoss, {good: 1, medium: 3})}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">网络稳定性:</span>
                  <span className={`font-medium ${gameLatencyResult.stability > 70 ? 'text-green-600' : 
                    gameLatencyResult.stability > 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {gameLatencyResult.stability}/100
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">测试服务器:</span>
                  <span className="font-medium">{gameLatencyResult.servers.length}</span>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-gray-700 font-medium">{getGameLatencyAssessment(gameLatencyResult, selectedGameType)}</p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={runGameLatencyTest}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlayCircle className="w-5 h-5 mr-2" />
                  重新测试
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-800 mb-2">测试内容</h4>
                <ul className="list-disc pl-5 space-y-1 text-blue-700">
                  <li>测量多个游戏服务器的延迟（Ping值）</li>
                  <li>测量网络抖动（延迟的波动）</li>
                  <li>检测数据包丢失情况</li>
                  <li>计算网络稳定性指数</li>
                  <li>根据所选游戏类型提供网络质量评估</li>
                </ul>
              </div>
              
              <button
                onClick={runGameLatencyTest}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                开始测试
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* 游戏延迟优化指南 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">游戏延迟优化指南</h3>
        <p className="text-gray-600 mb-4">
          您可以通过以下方式提高游戏网络性能：
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>使用有线连接代替WiFi，以获得更稳定的连接</li>
          <li>关闭后台下载和流媒体应用，减少带宽占用</li>
          <li>确保路由器固件为最新版本</li>
          <li>考虑使用游戏加速器，优化到游戏服务器的路由</li>
          <li>选择距离您较近的游戏服务器</li>
          <li>使用QoS（服务质量）设置，为游戏流量设置高优先级</li>
        </ul>
        <div className="mt-4 bg-blue-50 p-3 rounded-lg">
          <p className="text-blue-700 text-sm">
            <span className="font-medium">提示：</span> 抖动(jitter)对于游戏体验的影响可能比略高的ping值更大。
            稳定的100ms延迟通常比波动在30-80ms之间的延迟提供更好的游戏体验。
          </p>
        </div>
      </div>
    </div>
  );
};

export default GameLatencyTestPage; 