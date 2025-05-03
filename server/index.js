const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cluster = require('cluster');
const os = require('os');
const { performance } = require('perf_hooks');
const dotenv = require('dotenv');
const moment = require('moment');

// 加载环境变量
dotenv.config();

// 导入自定义服务
const geoIpService = require('./services/geoIpService');

// 是否使用多进程模式（高并发）
const ENABLE_CLUSTER = process.env.ENABLE_CLUSTER === 'true';
const NUM_WORKERS = parseInt(process.env.NUM_WORKERS, 10) || os.cpus().length;

// 创建日志目录
const LOGS_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// 日志文件路径
const LOG_FILE = path.join(LOGS_DIR, `speedtest-server-${moment().format('YYYY-MM-DD')}.log`);

// 日志写入函数
function writeLog(message) {
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
  const logMessage = `[${timestamp}] ${message}\n`;
  
  // 打印到控制台
  console.log(logMessage.trim());
  
  // 写入到日志文件
  fs.appendFileSync(LOG_FILE, logMessage);
}

// 如果启用集群且是主进程，则创建工作进程
if (ENABLE_CLUSTER && cluster.isMaster) {
  writeLog(`主进程 ${process.pid} 正在运行`);

  // 创建工作进程
  for (let i = 0; i < NUM_WORKERS; i++) {
    cluster.fork();
  }

  // 如果工作进程退出，重新创建
  cluster.on('exit', (worker, code, signal) => {
    writeLog(`工作进程 ${worker.process.pid} 已退出，创建新进程`);
    cluster.fork();
  });
} else {
  // 工作进程或单进程模式
  startServer();
}

// 启动服务器函数
async function startServer() {
  // 创建应用
  const app = express();
  const PORT = process.env.PORT || 3001;

  // 中间件
  app.use(cors());
  app.use(express.json());
  
  // 添加请求日志中间件
  app.use((req, res, next) => {
    const start = performance.now();
    const clientIp = getClientIp(req);
    
    // 在请求完成时记录日志
    res.on('finish', () => {
      const duration = Math.round(performance.now() - start);
      writeLog(`${clientIp} ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    });
    
    // 记录请求日志
    writeLog(`收到请求: ${req.method} ${req.originalUrl} 来自 ${clientIp}`);
    next();
  });

  // 配置multer用于处理上传
  const storage = multer.memoryStorage(); // 使用内存存储，不实际保存文件
  const upload = multer({ 
    storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 限制上传大小为100MB
  });

  // WebSocket用于实时通信
  const http = require('http');
  const WebSocket = require('ws');
  const server = http.createServer(app);
  const wss = new WebSocket.Server({ server });

  // 测试文件目录
  const TEST_FILES_DIR = path.join(__dirname, 'test-files');

  // 确保测试文件目录存在
  if (!fs.existsSync(TEST_FILES_DIR)) {
    fs.mkdirSync(TEST_FILES_DIR, { recursive: true });
  }

  // 初始化GeoIP数据库
  try {
    // 初始化GeoIP数据库
    const geoIpInitialized = await geoIpService.initGeoIpDatabases();
    if (!geoIpInitialized) {
      writeLog('警告: GeoIP数据库初始化失败，IP位置服务将不可用');
    }
  } catch (error) {
    writeLog(`错误: 服务初始化失败: ${error.message}`);
  }

  // 生成测试文件大小配置（字节）
  const TEST_FILE_SIZES = {
    xs: 256 * 1024,       // 256KB
    s: 1 * 1024 * 1024,   // 1MB
    m: 5 * 1024 * 1024,   // 5MB
    l: 10 * 1024 * 1024,  // 10MB
    xl: 100 * 1024 * 1024, // 100MB
  };

  // 创建测试文件
  function createTestFiles() {
    writeLog('检查测试文件...');
    Object.entries(TEST_FILE_SIZES).forEach(([size, bytes]) => {
      const filePath = path.join(TEST_FILES_DIR, `test-${size}.bin`);
      
      // 如果文件不存在或大小不正确，则创建
      if (!fs.existsSync(filePath) || fs.statSync(filePath).size !== bytes) {
        writeLog(`创建测试文件: test-${size}.bin (${bytes} 字节)`);
        const buffer = Buffer.alloc(bytes);
        crypto.randomFillSync(buffer); // 使用随机数据填充
        fs.writeFileSync(filePath, buffer);
      }
    });
    writeLog('测试文件检查完成');
  }

  // 启动时创建测试文件
  createTestFiles();

  // 获取客户端IP地址
  function getClientIp(req) {
    return req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress ||
           req.socket.remoteAddress || 
           req.connection.socket.remoteAddress;
  }

  // 路由：服务器信息
  app.get('/api/server-info', (req, res) => {
    const clientIp = getClientIp(req);
    writeLog(`处理服务器信息请求 - 客户端IP: ${clientIp}`);
    
    // 尝试获取位置信息
    const locationInfo = geoIpService.lookupIpInfo(clientIp);
    
    res.json({
      name: '高性能测速服务器',
      version: '2.0.0',
      location: '本地测试节点',
      supportedTests: ['ping', 'download', 'upload', 'jitter', 'packetloss'],
      capabilities: {
        concurrentConnections: true,
        dynamicFileSize: true,
        realTimeData: true,
        geoIpLookup: !!locationInfo
      },
      clientInfo: locationInfo || { ip: clientIp }
    });
  });

  // 路由：用户IP信息
  app.get('/api/client-info', (req, res) => {
    const clientIp = getClientIp(req);
    const locationInfo = geoIpService.lookupIpInfo(clientIp);
    
    if (locationInfo) {
      res.json({
        success: true,
        locationInfo
      });
    } else {
      res.json({
        success: false,
        error: 'IP信息查询失败',
        ip: clientIp
      });
    }
  });

  // 路由：Ping测试
  app.get('/api/ping', (req, res) => {
    const clientIp = getClientIp(req);
    // 添加服务器处理延迟，模拟真实场景
    const serverProcessingTime = Math.random() * 2; // 0-2毫秒随机处理时间
    
    writeLog(`处理Ping请求 - 客户端IP: ${clientIp}, 处理时间: ${serverProcessingTime.toFixed(2)}ms`);
    
    // 返回时间戳和服务器处理时间
    res.json({
      timestamp: Date.now(),
      serverProcessingTime
    });
  });

  // 路由：丢包率测试
  app.get('/api/packetloss', (req, res) => {
    const clientIp = getClientIp(req);
    const packetId = req.query.id || Date.now();
    
    writeLog(`处理丢包率测试请求 - 客户端IP: ${clientIp}, 包ID: ${packetId}`);
    
    // 随机模拟丢包（实际上总是响应，丢包是在客户端通过超时判断）
    res.json({
      success: true,
      packetId,
      timestamp: Date.now()
    });
  });

  // 路由：下载文件
  app.get('/api/download', (req, res) => {
    const clientIp = getClientIp(req);
    const size = req.query.size || 's';
    const throttleKBps = parseInt(req.query.throttle, 10) || 0;
    
    writeLog(`处理下载请求 - 客户端IP: ${clientIp}, 文件大小: ${size}, 限速: ${throttleKBps}KB/s`);
    
    // 验证文件大小参数
    if (!TEST_FILE_SIZES[size]) {
      writeLog(`错误: 无效的文件大小参数: ${size}`);
      return res.status(400).json({ error: '无效的文件大小参数' });
    }
    
    try {
      const filePath = path.join(TEST_FILES_DIR, `test-${size}.bin`);
      
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        writeLog(`错误: 测试文件不存在: ${filePath}`);
        return res.status(500).json({ error: '测试文件不存在' });
      }
      
      // 获取文件大小
      const stat = fs.statSync(filePath);
      
      // 设置响应头
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename=speedtest-${size}.bin`);
      res.setHeader('Cache-Control', 'no-store');
      
      // 如果请求了限速，应用限速
      if (throttleKBps > 0) {
        writeLog(`应用下载限速: ${throttleKBps}KB/s`);
        
        // 创建读取流
        const fileStream = fs.createReadStream(filePath);
        
        // 限速参数
        const bytesPerSecond = throttleKBps * 1024;
        const chunkSize = Math.min(16 * 1024, bytesPerSecond / 10); // 每个块最大16KB
        const delayMs = (chunkSize / bytesPerSecond) * 1000;
        
        // 实现限速流
        fileStream.on('data', (chunk) => {
          // 暂停流
          fileStream.pause();
          
          // 写入数据
          res.write(chunk);
          
          // 延迟后恢复
          setTimeout(() => {
            fileStream.resume();
          }, delayMs);
        });
        
        fileStream.on('end', () => {
          res.end();
          writeLog(`下载完成 - 客户端IP: ${clientIp}, 文件大小: ${size}`);
        });
        
        fileStream.on('error', (err) => {
          writeLog(`下载错误 - 客户端IP: ${clientIp}, 错误: ${err.message}`);
          res.end();
        });
      } else {
        // 无限速，直接发送文件
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
        fileStream.on('end', () => {
          writeLog(`下载完成 - 客户端IP: ${clientIp}, 文件大小: ${size}`);
        });
        
        fileStream.on('error', (err) => {
          writeLog(`下载错误 - 客户端IP: ${clientIp}, 错误: ${err.message}`);
          res.end();
        });
      }
    } catch (error) {
      writeLog(`下载处理错误: ${error.message}`);
      res.status(500).json({ error: '下载处理错误' });
    }
  });

  // 路由：上传测试
  app.post('/api/upload', upload.single('file'), (req, res) => {
    const clientIp = getClientIp(req);
    const fileSize = req.file ? req.file.size : 0;
    
    writeLog(`处理上传请求 - 客户端IP: ${clientIp}, 文件大小: ${fileSize} 字节`);
    
    // 返回成功消息和上传大小
    res.json({
      success: true,
      size: fileSize,
      timestamp: Date.now()
    });
  });

  // 路由：保存测速结果
  app.post('/api/save-result', async (req, res) => {
    const clientIp = getClientIp(req);
    const result = req.body;
    
    writeLog(`保存测试结果 - 客户端IP: ${clientIp}, 下载: ${result.downloadSpeed} Mbps, 上传: ${result.uploadSpeed} Mbps`);
    
    try {
      // 添加IP信息
      result.ip = clientIp;
      result.locationInfo = geoIpService.lookupIpInfo(clientIp);
      result.timestamp = result.timestamp || Date.now();
      
      // 不再保存到数据库，只记录日志
      writeLog(`测试结果详情: ${JSON.stringify(result)}`);
      
      res.json({
        success: true,
        message: '测试结果已记录'
      });
    } catch (error) {
      writeLog(`保存测试结果错误: ${error.message}`);
      res.status(500).json({
        success: false,
        message: '保存测试结果时发生错误'
      });
    }
  });

  // 路由：多段上传测试（更准确测量大文件上传）
  app.post('/api/upload-chunk', upload.single('chunk'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: '未提供文件块' });
    }
    
    // 记录分块上传信息
    const chunkInfo = {
      chunkSize: req.file.size,
      chunkIndex: req.body.index || 0,
      totalChunks: req.body.total || 1,
      receivedAt: Date.now()
    };
    
    // 返回分块信息
    res.json({
      success: true,
      chunkInfo
    });
  });

  // WebSocket处理
  wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    writeLog(`WebSocket连接已建立 - 客户端IP: ${clientIp}`);
    
    ws.on('message', (message) => {
      writeLog(`收到WebSocket消息: ${message}`);
    });
    
    ws.on('close', () => {
      writeLog(`WebSocket连接已关闭 - 客户端IP: ${clientIp}`);
    });
    
    ws.on('error', (error) => {
      writeLog(`WebSocket错误: ${error.message}`);
    });
  });

  // 提供静态文件（前端构建产物）
  // app.use(express.static(path.join(__dirname, '../dist')));

  // 全局错误处理中间件
  app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  });

  // 启动服务器
  server.listen(PORT, '0.0.0.0', () => {
    writeLog(`🚀 速度测试服务器运行在端口 ${PORT} - 进程 ${process.pid}`);
    writeLog(`服务器URL: http://localhost:${PORT}/api`);
    writeLog(`测试服务器已准备就绪，可以开始测试。`);
  });
} 