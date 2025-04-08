const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cluster = require('cluster');
const os = require('os');
const { performance } = require('perf_hooks');

// 是否使用多进程模式（高并发）
const ENABLE_CLUSTER = process.env.ENABLE_CLUSTER === 'true';
const NUM_WORKERS = process.env.NUM_WORKERS || os.cpus().length;

// 如果启用集群且是主进程，则创建工作进程
if (ENABLE_CLUSTER && cluster.isMaster) {
  console.log(`主进程 ${process.pid} 正在运行`);

  // 创建工作进程
  for (let i = 0; i < NUM_WORKERS; i++) {
    cluster.fork();
  }

  // 如果工作进程退出，重新创建
  cluster.on('exit', (worker, code, signal) => {
    console.log(`工作进程 ${worker.process.pid} 已退出，创建新进程`);
    cluster.fork();
  });
} else {
  // 工作进程或单进程模式
  startServer();
}

// 启动服务器函数
function startServer() {
  // 创建应用
  const app = express();
  const PORT = process.env.PORT || 3001;

  // 中间件
  app.use(cors());
  app.use(express.json());

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
    console.log('检查测试文件...');
    Object.entries(TEST_FILE_SIZES).forEach(([size, bytes]) => {
      const filePath = path.join(TEST_FILES_DIR, `test-${size}.bin`);
      
      // 如果文件不存在或大小不正确，则创建
      if (!fs.existsSync(filePath) || fs.statSync(filePath).size !== bytes) {
        console.log(`创建测试文件: test-${size}.bin (${bytes} 字节)`);
        const buffer = Buffer.alloc(bytes);
        crypto.randomFillSync(buffer); // 使用随机数据填充
        fs.writeFileSync(filePath, buffer);
      }
    });
    console.log('测试文件检查完成');
  }

  // 启动时创建测试文件
  createTestFiles();

  // 路由：服务器信息
  app.get('/api/server-info', (req, res) => {
    res.json({
      name: '高性能测速服务器',
      version: '2.0.0',
      location: '本地测试节点',
      supportedTests: ['ping', 'download', 'upload', 'jitter', 'packetloss'],
      capabilities: {
        concurrentConnections: true,
        dynamicFileSize: true,
        realTimeData: true
      }
    });
  });

  // 路由：Ping测试
  app.get('/api/ping', (req, res) => {
    // 添加延迟服务器端处理时间统计
    const serverProcessingStart = performance.now();
    // 添加模拟网络处理延迟(1-5ms随机)
    setTimeout(() => {
      const serverProcessingTime = performance.now() - serverProcessingStart;
      res.json({ 
        timestamp: Date.now(),
        serverProcessingTime
      });
    }, Math.random() * 5);
  });

  // 路由：丢包率测试
  app.get('/api/packetloss', (req, res) => {
    // 该路由永远响应，用于测试丢包率
    res.json({ 
      timestamp: Date.now(),
      packetId: req.query.id,
      received: true 
    });
  });

  // 路由：下载文件
  app.get('/api/download', (req, res) => {
    const size = req.query.size || 's';
    const validSizes = Object.keys(TEST_FILE_SIZES);
    
    if (!validSizes.includes(size)) {
      return res.status(400).json({ error: `无效的文件大小。有效值: ${validSizes.join(', ')}` });
    }
    
    const filePath = path.join(TEST_FILES_DIR, `test-${size}.bin`);
    
    // 设置响应头
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename=test-${size}.bin`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Speed-Test-Size': TEST_FILE_SIZES[size]
    });
    
    // 添加可选的限速功能，模拟不同网络情况
    const throttle = parseInt(req.query.throttle, 10) || 0;
    if (throttle > 0) {
      const fileStream = fs.createReadStream(filePath);
      const throttleStream = require('throttle');
      const throttledStream = new throttleStream(throttle * 1024); // 速率为 KB/s
      fileStream.pipe(throttledStream).pipe(res);
    } else {
      // 直接发送文件（无限速）
      res.sendFile(filePath);
    }
  });

  // 路由：上传测试
  app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: '未提供文件' });
    }
    
    // 记录上传信息
    const uploadInfo = {
      originalSize: req.file.size,
      mimeType: req.file.mimetype,
      receivedAt: Date.now()
    };
    
    // 由于使用内存存储，实际并不保存文件
    // 仅返回上传信息
    res.json({
      success: true,
      uploadInfo
    });
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
  wss.on('connection', (ws) => {
    console.log('新的WebSocket连接');

    // 连接建立时分配唯一ID
    const clientId = crypto.randomUUID();
    ws.clientId = clientId;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        
        // 处理不同类型的消息
        switch (data.type) {
          case 'ping':
            // 简单的ping/pong测试
            ws.send(JSON.stringify({
              type: 'pong',
              id: data.id,
              timestamp: Date.now(),
              serverReceivedTimestamp: Date.now()
            }));
            break;
            
          case 'startRealTimeTest':
            // 开始实时测速测试
            const testInterval = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'realTimeData',
                  timestamp: Date.now(),
                  data: {
                    // 这里可以发送实时数据
                  }
                }));
              } else {
                clearInterval(testInterval);
              }
            }, 200); // 每200ms发送一次数据
            
            // 存储interval用于清理
            ws.testInterval = testInterval;
            break;
            
          case 'stopRealTimeTest':
            if (ws.testInterval) {
              clearInterval(ws.testInterval);
              ws.testInterval = null;
            }
            break;
            
          case 'packetLossTest':
            // 简单的丢包测试响应 
            ws.send(JSON.stringify({
              type: 'packetLossResponse',
              id: data.id,
              timestamp: Date.now()
            }));
            break;
        }
      } catch (err) {
        console.error('WebSocket消息处理错误:', err);
      }
    });

    // 处理连接关闭
    ws.on('close', () => {
      console.log('WebSocket连接关闭');
      if (ws.testInterval) {
        clearInterval(ws.testInterval);
      }
    });

    // 发送欢迎消息
    ws.send(JSON.stringify({
      type: 'welcome',
      clientId,
      timestamp: Date.now(),
      message: '已连接到测速服务器WebSocket'
    }));
  });

  // 提供静态文件（前端构建产物）
  // app.use(express.static(path.join(__dirname, '../dist')));

  // 全局错误处理中间件
  app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  });

  // 启动服务器
  server.listen(PORT, () => {
    console.log(`测速服务器运行在端口 ${PORT} (PID: ${process.pid})`);
    console.log('可用测试端点:');
    console.log('- GET  /api/server-info   : 获取服务器信息');
    console.log('- GET  /api/ping          : ping测试');
    console.log('- GET  /api/packetloss    : 丢包率测试');
    console.log('- GET  /api/download      : 下载测试 (参数: size=xs|s|m|l|xl, throttle=速率KB/s)');
    console.log('- POST /api/upload        : 上传测试 (提交file字段)');
    console.log('- WS   ws://localhost:3001: WebSocket端点 (实时数据和高级测试)');
  });
} 