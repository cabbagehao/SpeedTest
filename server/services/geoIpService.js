const maxmind = require('maxmind');
const path = require('path');
const fs = require('fs');
const ipAnonymize = require('ip-anonymize');
require('dotenv').config();

// GeoIP数据库路径
const GEOIP_CITY_DB_PATH = process.env.GEOIP_CITY_DB_PATH || './ip_database/GeoLite2-City.mmdb';
const GEOIP_ASN_DB_PATH = process.env.GEOIP_ASN_DB_PATH || './ip_database/GeoLite2-ASN.mmdb';

// 数据库实例
let cityLookup = null;
let asnLookup = null;

/**
 * 初始化GeoIP数据库
 */
async function initGeoIpDatabases() {
  try {
    // 检查数据库文件是否存在
    if (!fs.existsSync(GEOIP_CITY_DB_PATH)) {
      console.error(`错误: GeoIP城市数据库文件不存在: ${GEOIP_CITY_DB_PATH}`);
      return false;
    }

    if (!fs.existsSync(GEOIP_ASN_DB_PATH)) {
      console.error(`错误: GeoIP ASN数据库文件不存在: ${GEOIP_ASN_DB_PATH}`);
      return false;
    }

    // 加载数据库
    cityLookup = await maxmind.open(GEOIP_CITY_DB_PATH);
    asnLookup = await maxmind.open(GEOIP_ASN_DB_PATH);
    
    console.log('GeoIP数据库已成功加载');
    return true;
  } catch (error) {
    console.error('GeoIP数据库初始化失败:', error);
    return false;
  }
}

/**
 * 获取IP地址的地理位置信息
 * @param {string} ip - IP地址
 * @returns {object} 地理位置信息
 */
function lookupIpInfo(ip) {
  try {
    if (!cityLookup || !asnLookup) {
      console.error('GeoIP数据库未初始化');
      return null;
    }

    // 清理IP地址（移除端口等）
    const cleanIp = ip.replace(/:\d+$/, '').replace(/^::ffff:/, '');
    
    // 匿名化IP（隐藏最后两个部分）
    const anonymizedIp = ipAnonymize(cleanIp);
    
    // 查询城市和ASN信息
    const cityInfo = cityLookup.get(cleanIp);
    const asnInfo = asnLookup.get(cleanIp);
    
    // 整合结果
    return {
      ip: cleanIp,
      anonymizedIp,
      city: cityInfo?.city?.names?.en || '未知',
      country: cityInfo?.country?.names?.en || '未知',
      continent: cityInfo?.continent?.names?.en || '未知',
      latitude: cityInfo?.location?.latitude,
      longitude: cityInfo?.location?.longitude,
      timezone: cityInfo?.location?.time_zone || 'UTC',
      asn: asnInfo?.autonomous_system_number,
      isp: asnInfo?.autonomous_system_organization || '未知',
    };
  } catch (error) {
    console.error('IP查询失败:', error);
    return null;
  }
}

module.exports = {
  initGeoIpDatabases,
  lookupIpInfo,
}; 