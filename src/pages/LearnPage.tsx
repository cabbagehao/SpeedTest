import React, { useState } from 'react';
import { Clock, ArrowRight, Bookmark } from 'lucide-react';

// 导入课程文章组件
import SpeedTestArticle from '../components/learn/SpeedTestArticle';
import FactorsArticle from '../components/learn/FactorsArticle';
import IspArticle from '../components/learn/IspArticle';
import FiveGArticle from '../components/learn/FiveGArticle';
import SlowSpeedArticle from '../components/learn/SlowSpeedArticle';

type ArticleId = 'speed-test' | 'factors' | 'isp' | 'five-g' | 'slow-speed';

interface Article {
  id: ArticleId;
  title: string;
  description: string;
  readTime: number;
  component: React.ComponentType;
}

const LearnPage: React.FC = () => {
  const [activeArticle, setActiveArticle] = useState<ArticleId | null>(null);
  
  const articles: Article[] = [
    {
      id: 'speed-test',
      title: '如何测试网络速度及其意义',
      description: '了解网速测试的原理，以及它对您的在线体验有何重要意义。',
      readTime: 5,
      component: SpeedTestArticle
    },
    {
      id: 'factors',
      title: '影响网速的主要因素及解决方法',
      description: '探索可能降低您网络性能的常见因素，以及如何解决这些问题。',
      readTime: 7,
      component: FactorsArticle
    },
    {
      id: 'isp',
      title: '如何选择最佳的互联网服务提供商',
      description: '选择ISP时需要考虑的关键因素，以及如何为您的需求找到最好的匹配。',
      readTime: 6,
      component: IspArticle
    },
    {
      id: 'five-g',
      title: '全球 5G 网速对比',
      description: '探索全球5G部署情况，比较不同国家和地区的5G网络性能。',
      readTime: 8,
      component: FiveGArticle
    },
    {
      id: 'slow-speed',
      title: '网速慢的原因及优化方法',
      description: '解析导致网络速度下降的常见原因，并提供实用的解决方案。',
      readTime: 6,
      component: SlowSpeedArticle
    }
  ];
  
  const handleArticleClick = (id: ArticleId) => {
    setActiveArticle(id);
    // 滚动到页面顶部
    window.scrollTo(0, 0);
  };
  
  const handleBackClick = () => {
    setActiveArticle(null);
    // 滚动到页面顶部
    window.scrollTo(0, 0);
  };
  
  // 显示文章列表或选定的文章
  if (activeArticle) {
    const article = articles.find(a => a.id === activeArticle);
    if (!article) return null;
    
    const ArticleComponent = article.component;
    
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full">
        <button 
          onClick={handleBackClick}
          className="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center"
        >
          <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
          <span>返回文章列表</span>
        </button>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{article.title}</h1>
        <div className="flex items-center text-gray-500 mb-6">
          <Clock className="w-4 h-4 mr-1" />
          <span>阅读时间：约 {article.readTime} 分钟</span>
        </div>
        
        <div className="prose prose-indigo max-w-none">
          <ArticleComponent />
        </div>
      </div>
    );
  }
  
  // 显示文章列表
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">网速课堂</h1>
      <p className="text-gray-600 mb-8">探索关于互联网速度、连接质量和网络优化的精选文章，提升您的网络体验。</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {articles.map((article) => (
          <div 
            key={article.id}
            className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleArticleClick(article.id)}
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-start">
              <Bookmark className="w-5 h-5 text-indigo-500 mr-2 flex-shrink-0 mt-1" />
              <span>{article.title}</span>
            </h2>
            <p className="text-gray-600 mb-4">{article.description}</p>
            <div className="flex justify-between items-center">
              <div className="flex items-center text-gray-500 text-sm">
                <Clock className="w-4 h-4 mr-1" />
                <span>{article.readTime} 分钟阅读</span>
              </div>
              <button 
                className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  handleArticleClick(article.id);
                }}
              >
                阅读文章
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LearnPage; 