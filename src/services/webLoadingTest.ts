// 网页加载速度测试服务

import { WebLoadingTestResult } from './speedTestTypes';
import { SPEED_TEST_SERVER } from './speedTestConfig';

// 调试模式 - 设置为true可以查看更详细的日志
const DEBUG_MODE = true;

// 测试网站列表 - 这些是模拟的URL，实际测试将使用服务器提供的测试页面
const TEST_WEBSITES = [
  'news', 
  'shopping',
  'social',
  'blog',
  'multimedia'
];

// 真实测试网站列表
const REAL_TEST_WEBSITES = [
  { name: '新闻网站', url: 'https://news.qq.com' },
  { name: '购物网站', url: 'https://www.jd.com' },
  { name: '社交网站', url: 'https://weibo.com' },
  { name: '搜索引擎', url: 'https://www.baidu.com' },
  { name: '视频网站', url: 'https://www.bilibili.com' }
];

/**
 * 模拟加载单个网页并测量性能指标
 * @param siteType 网站类型
 * @param bandwidth 估计的带宽 (Mbps)
 * @returns 加载性能指标
 */
const simulateWebPageLoad = async (
  siteType: string,
  bandwidth: number
): Promise<{
  success: boolean;
  loadTime: number;
  firstContentfulPaint: number;
}> => {
  const startTime = performance.now();
  
  try {
    // 使用不同大小的测试文件来模拟不同类型网站的加载
    let fileSize = 's'; // 默认1MB
    
    // 根据网站类型选择不同的模拟文件大小
    switch (siteType) {
      case 'news':
        fileSize = 's'; // 新闻网站，较轻量
        break;
      case 'shopping':
        fileSize = 'm'; // 电商网站，中等大小
        break;
      case 'social':
        fileSize = 'm'; // 社交网站，中等大小
        break;
      case 'blog':
        fileSize = 's'; // 博客，较轻量
        break;
      case 'multimedia':
        fileSize = 'l'; // 多媒体网站，较大
        break;
    }
    
    // 模拟加载主要资源
    const response = await fetch(
      `${SPEED_TEST_SERVER.baseUrl}${SPEED_TEST_SERVER.endpoints.download}?size=${fileSize}&ts=${Date.now()}`, 
      { method: 'GET', cache: 'no-store' }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    // 记录首次内容绘制时间 (模拟)
    const firstPaintTime = performance.now();
    const firstContentfulPaint = firstPaintTime - startTime;
    
    // 模拟加载剩余资源 (异步)
    const arrayBuffer = await response.arrayBuffer();
    
    // 记录完全加载时间
    const endTime = performance.now();
    const totalLoadTime = endTime - startTime;
    
    if (DEBUG_MODE) {
      console.log(`网页加载模拟 - 类型: ${siteType}, 文件大小: ${fileSize}`);
      console.log(`首次内容绘制: ${firstContentfulPaint.toFixed(2)}ms, 总加载时间: ${totalLoadTime.toFixed(2)}ms`);
    }
    
    return {
      success: true,
      loadTime: totalLoadTime,
      firstContentfulPaint: firstContentfulPaint
    };
  } catch (error) {
    console.error(`${siteType}网页加载失败:`, error);
    return {
      success: false,
      loadTime: 0,
      firstContentfulPaint: 0
    };
  }
};

/**
 * 测试真实网站的加载性能
 * @param url 网站URL
 * @returns 加载性能指标
 */
const testRealWebsite = async (url: string): Promise<{
  success: boolean;
  loadTime: number;
  firstContentfulPaint: number;
}> => {
  // 创建一个隐藏的iframe
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  
  const startTime = performance.now();
  let fcpTime = 0;
  
  try {
    // 创建一个Promise来等待页面加载
    const loadPromise = new Promise<{loadTime: number, fcp: number}>((resolve, reject) => {
      // 设置加载超时
      const timeoutId = setTimeout(() => {
        reject(new Error('页面加载超时'));
      }, 15000); // 15秒超时
      
      iframe.onload = () => {
        clearTimeout(timeoutId);
        const loadTime = performance.now() - startTime;
        resolve({loadTime, fcp: fcpTime || loadTime * 0.4}); // 如果无法测量FCP，则估计为加载时间的40%
      };
      
      iframe.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error('页面加载失败'));
      };
      
      // 尝试估计首次内容绘制时间
      setTimeout(() => {
        if (fcpTime === 0) {
          fcpTime = performance.now() - startTime;
        }
      }, 200); // 假设200ms后有首次内容展示
    });
    
    iframe.src = url;
    const {loadTime, fcp} = await loadPromise;
    
    if (DEBUG_MODE) {
      console.log(`真实网站加载 - URL: ${url}`);
      console.log(`首次内容绘制: ${fcp.toFixed(2)}ms, 总加载时间: ${loadTime.toFixed(2)}ms`);
    }
    
    return {
      success: true,
      loadTime,
      firstContentfulPaint: fcp
    };
  } catch (error) {
    console.error(`真实网站加载失败: ${url}`, error);
    return {
      success: false,
      loadTime: 0,
      firstContentfulPaint: 0
    };
  } finally {
    // 清理iframe
    document.body.removeChild(iframe);
  }
};

/**
 * 执行网页加载速度测试
 * @param downloadSpeed 已知的下载速度 (Mbps)
 * @param progressCallback 进度回调函数
 * @param useRealWebsites 是否使用真实网站测试 
 * @returns 网页加载测试结果
 */
export const testWebLoading = async (
  downloadSpeed: number,
  progressCallback?: (progress: number, stage: string) => void,
  useRealWebsites: boolean = false
): Promise<WebLoadingTestResult> => {
  if (DEBUG_MODE) {
    console.log(`开始网页加载速度测试，下载速度: ${downloadSpeed} Mbps, 使用真实网站: ${useRealWebsites}`);
  }
  
  // 初始化结果
  const result: WebLoadingTestResult = {
    averageLoadTime: 0,
    firstContentfulPaint: 0,
    fullLoadTime: 0,
    testSites: [],
    timestamp: Date.now()
  };
  
  const testStartTime = performance.now();
  
  try {
    const loadTimes: number[] = [];
    const fcpTimes: number[] = [];
    const successfulSites: string[] = [];
    
    if (useRealWebsites) {
      // 测试真实网站
      for (let i = 0; i < REAL_TEST_WEBSITES.length; i++) {
        const site = REAL_TEST_WEBSITES[i];
        
        // 更新进度
        if (progressCallback) {
          progressCallback(
            (i / REAL_TEST_WEBSITES.length) * 100,
            `测试${site.name}加载`
          );
        }
        
        // 执行真实网站加载测试
        const loadResult = await testRealWebsite(site.url);
        
        if (loadResult.success) {
          loadTimes.push(loadResult.loadTime);
          fcpTimes.push(loadResult.firstContentfulPaint);
          successfulSites.push(site.name);
        }
      }
    } else {
      // 使用模拟测试
      for (let i = 0; i < TEST_WEBSITES.length; i++) {
        const siteType = TEST_WEBSITES[i];
        
        // 更新进度
        if (progressCallback) {
          progressCallback(
            (i / TEST_WEBSITES.length) * 100,
            `测试${siteType}类型网站加载`
          );
        }
        
        // 执行网页加载测试
        const loadResult = await simulateWebPageLoad(siteType, downloadSpeed);
        
        if (loadResult.success) {
          loadTimes.push(loadResult.loadTime);
          fcpTimes.push(loadResult.firstContentfulPaint);
          successfulSites.push(siteType);
        }
      }
    }
    
    // 更新进度为100%
    if (progressCallback) {
      progressCallback(100, '完成网页加载测试');
    }
    
    // 计算平均值
    if (loadTimes.length > 0) {
      result.averageLoadTime = loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length;
      result.firstContentfulPaint = fcpTimes.reduce((sum, time) => sum + time, 0) / fcpTimes.length;
      result.fullLoadTime = Math.max(...loadTimes);
      result.testSites = successfulSites;
    }
    
  } catch (error) {
    console.error('网页加载测试失败:', error);
  } finally {
    // 记录测试持续时间
    const testDuration = performance.now() - testStartTime;
    
    if (DEBUG_MODE) {
      console.log(`网页加载测试完成，耗时: ${(testDuration / 1000).toFixed(2)}秒`);
      console.log('网页加载测试结果:', result);
    }
    
    return result;
  }
};

/**
 * 获取网页加载性能的评估
 * @param result 网页加载测试结果
 * @returns 网页加载性能评估描述
 */
export const getWebLoadingAssessment = (result: WebLoadingTestResult): string => {
  // 网页加载时间评级（毫秒）
  const loadingSpeedRatings = {
    excellent: 1000, // 小于1秒为优秀
    good: 2500,      // 小于2.5秒为良好
    average: 5000,   // 小于5秒为一般
    slow: 10000      // 小于10秒为较慢
    // 超过10秒为非常慢
  };
  
  // 首次内容绘制时间评级（毫秒）
  const fcpRatings = {
    excellent: 500,  // 小于0.5秒为优秀
    good: 1000,      // 小于1秒为良好
    average: 2000,   // 小于2秒为一般
    slow: 4000       // 小于4秒为较慢
    // 超过4秒为非常慢
  };
  
  // 判断加载速度等级
  let loadingSpeedRating: string;
  if (result.averageLoadTime < loadingSpeedRatings.excellent) {
    loadingSpeedRating = '极快';
  } else if (result.averageLoadTime < loadingSpeedRatings.good) {
    loadingSpeedRating = '快速';
  } else if (result.averageLoadTime < loadingSpeedRatings.average) {
    loadingSpeedRating = '一般';
  } else if (result.averageLoadTime < loadingSpeedRatings.slow) {
    loadingSpeedRating = '较慢';
  } else {
    loadingSpeedRating = '非常慢';
  }
  
  // 判断首次内容绘制等级
  let fcpRating: string;
  if (result.firstContentfulPaint < fcpRatings.excellent) {
    fcpRating = '极快';
  } else if (result.firstContentfulPaint < fcpRatings.good) {
    fcpRating = '快速';
  } else if (result.firstContentfulPaint < fcpRatings.average) {
    fcpRating = '一般';
  } else if (result.firstContentfulPaint < fcpRatings.slow) {
    fcpRating = '较慢';
  } else {
    fcpRating = '非常慢';
  }
  
  return `页面加载速度: ${loadingSpeedRating} (${(result.averageLoadTime / 1000).toFixed(2)}秒) | 首次内容显示: ${fcpRating} (${(result.firstContentfulPaint / 1000).toFixed(2)}秒)`;
};

/**
 * 测试单个自定义URL的加载性能
 * @param url 要测试的URL
 * @returns 加载性能指标
 */
export const testCustomUrl = async (url: string): Promise<{
  success: boolean;
  loadTime: number;
  firstContentfulPaint: number;
}> => {
  try {
    // 确保URL格式正确
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    return await testRealWebsite(url);
  } catch (error) {
    console.error('自定义URL测试失败:', error);
    return {
      success: false,
      loadTime: 0,
      firstContentfulPaint: 0
    };
  }
}; 