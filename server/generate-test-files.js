const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
  console.log('创建测试文件...');
  Object.entries(TEST_FILE_SIZES).forEach(([size, bytes]) => {
    const filePath = path.join(TEST_FILES_DIR, `test-${size}.bin`);
    
    // 如果文件不存在或大小不正确，则创建
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size !== bytes) {
      console.log(`创建测试文件: test-${size}.bin (${bytes} 字节)`);
      const buffer = Buffer.alloc(bytes);
      crypto.randomFillSync(buffer); // 使用随机数据填充
      fs.writeFileSync(filePath, buffer);
      console.log(`已完成: test-${size}.bin`);
    } else {
      console.log(`文件已存在且大小正确: test-${size}.bin`);
    }
  });
  console.log('所有测试文件创建完成');
}

// 执行创建测试文件的函数
createTestFiles(); 