const mongoose = require('mongoose');
const SpeedTestResult = require('../models/SpeedTestResult');
require('dotenv').config();

// 数据库连接URL
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/speedtest';

/**
 * 初始化数据库连接
 */
async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB数据库已连接');
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return false;
  }
}

/**
 * 保存测速结果并更新排行榜
 * @param {object} speedTestData - 测速数据
 * @param {object} locationInfo - 位置信息
 * @returns {object} 保存的结果
 */
async function saveSpeedTestResult(speedTestData, locationInfo) {
  try {
    // 创建结果对象
    const resultData = {
      ...speedTestData,
      location: locationInfo,
    };

    // 查询同一IP的最高记录
    const existingTopResult = await SpeedTestResult.findOne({
      'location.ip': locationInfo.ip,
      testType: speedTestData.testType || 'basic',
      isTopResult: true
    });

    // 决定是否更新排行榜
    let shouldUpdateLeaderboard = false;
    
    // 如果不存在排行榜记录，或新记录的下载速度更高
    if (!existingTopResult || 
        (speedTestData.downloadSpeed > existingTopResult.downloadSpeed)) {
      shouldUpdateLeaderboard = true;
    }

    // 保存新的测速结果
    const newResult = new SpeedTestResult({
      ...resultData,
      isTopResult: shouldUpdateLeaderboard
    });
    
    await newResult.save();

    // 如果需要更新排行榜，将老记录标记为非排行榜记录
    if (shouldUpdateLeaderboard && existingTopResult) {
      existingTopResult.isTopResult = false;
      await existingTopResult.save();
    }

    return newResult;
  } catch (error) {
    console.error('保存测速结果失败:', error);
    throw error;
  }
}

/**
 * 获取排行榜数据
 * @param {string} sortBy - 排序字段 ('download', 'upload', 'ping')
 * @param {number} limit - 结果数量限制
 * @param {string} filterType - 过滤类型 ('global', 'city', 'country', 'asn')
 * @param {string} filterValue - 过滤值
 * @returns {Array} 排行榜数据
 */
async function getLeaderboardData(sortBy = 'download', limit = 100, filterType = 'global', filterValue = null) {
  try {
    // 构建查询条件
    const query = { isTopResult: true };
    
    // 添加过滤条件
    if (filterType === 'city' && filterValue) {
      query['location.city'] = filterValue;
    } else if (filterType === 'country' && filterValue) {
      query['location.country'] = filterValue;
    } else if (filterType === 'asn' && filterValue) {
      query['location.asn'] = parseInt(filterValue);
    }
    
    // 构建排序条件
    let sort = {};
    if (sortBy === 'download') {
      sort = { downloadSpeed: -1 }; // 降序
    } else if (sortBy === 'upload') {
      sort = { uploadSpeed: -1 }; // 降序
    } else if (sortBy === 'ping') {
      sort = { ping: 1 }; // 升序
    }
    
    // 执行查询
    const results = await SpeedTestResult.find(query)
      .sort(sort)
      .limit(limit);
      
    return results;
  } catch (error) {
    console.error('获取排行榜数据失败:', error);
    throw error;
  }
}

/**
 * 获取可用的过滤选项
 * @returns {object} 过滤选项 (城市、国家、ASN列表)
 */
async function getFilterOptions() {
  try {
    // 获取所有唯一城市
    const cities = await SpeedTestResult.distinct('location.city');
    
    // 获取所有唯一国家
    const countries = await SpeedTestResult.distinct('location.country');
    
    // 获取所有唯一ASN和ISP
    const asnResults = await SpeedTestResult.aggregate([
      { $match: { 'location.asn': { $exists: true } } },
      { $group: { _id: '$location.asn', isp: { $first: '$location.isp' } } }
    ]);
    
    const asns = asnResults.map(item => ({
      asn: item._id,
      isp: item.isp
    }));
    
    return {
      cities: cities.filter(Boolean).sort(),
      countries: countries.filter(Boolean).sort(),
      asns: asns.sort((a, b) => a.asn - b.asn)
    };
  } catch (error) {
    console.error('获取过滤选项失败:', error);
    throw error;
  }
}

module.exports = {
  connectDatabase,
  saveSpeedTestResult,
  getLeaderboardData,
  getFilterOptions
}; 