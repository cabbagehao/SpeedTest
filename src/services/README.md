# 网络测速服务

本目录包含网络测速相关的所有服务和功能。代码已按功能模块拆分为多个文件，以提高可维护性。

## 文件结构

- **constants.ts** - 常量定义，包括服务器地址、URL、测试配置等
- **speedTestTypes.ts** - 类型定义，包括接口、类型和枚举等
- **speedTestConfig.ts** - 可配置的测试设置，如测试时间、文件大小等
- **speedTestUtils.ts** - 通用工具函数，如创建随机文件、存储历史记录等
- **networkInfo.ts** - 网络信息服务，包括Ping、丢包率、IP信息获取等
- **webSocketService.ts** - WebSocket连接管理服务
- **downloadTest.ts** - 下载速度测试实现
- **uploadTest.ts** - 上传速度测试实现
- **stabilityTest.ts** - 网络稳定性测试实现
- **speedTestController.ts** - 测速流程控制器，整合各模块功能
- **index.ts** - 统一导出接口
- **speedTest.ts** - 旧版兼容文件，仅用于导出

## 使用说明

推荐通过 index.ts 导入需要的功能：

```typescript
import { runSpeedTest, getTestHistory, clearTestHistory } from 'src/services';
```

## 主要功能

1. **基础测速** - 测量下载速度、上传速度、延迟、抖动和丢包率
2. **稳定性测试** - 长时间测试网络下载和上传的稳定性
3. **历史记录** - 保存和查看历史测速记录
4. **服务器信息** - 获取测速服务器信息和客户端网络信息

## 维护说明

代码经过重构拆分，每个文件都有明确的职责。添加新功能时，请遵循现有的模块化结构，并保持接口的一致性。