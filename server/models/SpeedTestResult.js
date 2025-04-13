const mongoose = require('mongoose');

// 速度数据点模式
const speedDataPointSchema = new mongoose.Schema({
  timestamp: Number,
  speed: Number, // Mbps
});

// 位置信息模式
const locationSchema = new mongoose.Schema({
  ip: String,         // 原始IP
  anonymizedIp: String, // 匿名化的IP
  city: String,
  country: String,
  continent: String,
  latitude: Number,
  longitude: Number,
  timezone: String,
  asn: Number,
  isp: String,
});

// 测速结果模式
const speedTestResultSchema = new mongoose.Schema({
  downloadSpeed: Number,
  uploadSpeed: Number,
  ping: Number,
  jitter: Number,
  packetLoss: Number,
  testServer: String,
  timestamp: {
    type: Number,
    default: Date.now,
  },
  downloadDataPoints: [speedDataPointSchema],
  uploadDataPoints: [speedDataPointSchema],
  location: locationSchema,
  testType: {
    type: String,
    enum: ['basic', 'streaming', 'webloading', 'gamelatency', 'videoconference'],
    default: 'basic',
  },
  // 用于排行榜排名和查询
  isTopResult: {
    type: Boolean,
    default: false,
  },
});

// 为IP和测试类型创建复合索引
speedTestResultSchema.index({ 'location.ip': 1, testType: 1 });
// 为排行榜查询创建索引
speedTestResultSchema.index({ isTopResult: 1, downloadSpeed: -1 });
speedTestResultSchema.index({ isTopResult: 1, uploadSpeed: -1 });
speedTestResultSchema.index({ isTopResult: 1, ping: 1 });
// 为地理位置查询创建索引
speedTestResultSchema.index({ 'location.city': 1 });
speedTestResultSchema.index({ 'location.country': 1 });
speedTestResultSchema.index({ 'location.asn': 1 });

module.exports = mongoose.model('SpeedTestResult', speedTestResultSchema); 