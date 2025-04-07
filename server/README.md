# 专用测速服务器

这是一个为网速测试应用设计的专用后端服务器，提供下载测试、上传测试和ping测试等功能。

## 功能特点

- 提供精确大小的测试文件用于下载测试
- 处理上传测试请求，计算真实上传速度
- 支持ping测试以测量网络延迟
- 自动创建不同大小的测试数据文件
- 支持CORS，允许跨域请求
- 内存处理上传文件，不占用磁盘空间

## API端点

| 端点 | 方法 | 描述 | 参数 |
|------|------|------|------|
| `/api/server-info` | GET | 获取服务器信息 | 无 |
| `/api/ping` | GET | Ping测试 | 无 |
| `/api/download` | GET | 下载测试文件 | `size`: xs(256KB), s(1MB), m(5MB), l(10MB) |
| `/api/upload` | POST | 上传测试 | 文件字段: `file` |
| `/api/upload-chunk` | POST | 分块上传测试 | 文件字段: `chunk`, 表单字段: `index`, `total` |

## 安装说明

1. 确保已安装Node.js (v14.x或更高版本)

2. 安装依赖:
   ```bash
   cd server
   npm install
   ```

3. 生成测试文件:
   ```bash
   node generate-test-files.js
   ```
   这将创建测试所需的所有二进制文件，大小范围从256KB到100MB。测试文件存储在`test-files`目录中，该目录已添加到`.gitignore`，以避免将大文件提交到版本控制系统。

4. 启动服务器:
   ```bash
   npm start
   ```

   开发模式 (自动重启):
   ```bash
   npm run dev
   ```

## 配置选项

可以通过环境变量配置服务器:

- `PORT`: 服务器端口 (默认: 3001)

示例:
```bash
PORT=4000 npm start
```

## 与前端集成

前端应用需要配置以使用此服务器:

1. 在前端项目的`src/services/speedTest.ts`文件中，确保`SPEED_TEST_SERVER`配置指向正确的服务器地址:

```typescript
const SPEED_TEST_SERVER = {
  baseUrl: 'http://localhost:3001/api',
  // ...
};
```

2. 如果服务器部署在不同的主机或端口，请相应更新baseUrl。

## 性能考虑

- 服务器使用内存存储处理上传的文件，不会保存到磁盘
- 测试文件会在首次启动时创建并缓存在服务器的`test-files`目录中
- 对于高并发情况，建议在生产环境中使用负载均衡

## 安全提示

此服务器仅用于测速目的，不应暴露在公共互联网上，除非进行了适当的安全加固。 