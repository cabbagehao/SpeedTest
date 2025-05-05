// 网速测试服务统一导出

// 导出类型
export * from './speedTestTypes';

// 从各模块导出API功能，避免常量名冲突
export {
  getClientIpInfo, getServerInfo, measurePing, measurePacketLoss
} from './networkInfo';

export {
  initWebSocketConnection, closeWebSocketConnection
} from './webSocketService';

export {
  createRandomBlob, determineBestFileSize, saveTestHistory,
  getTestHistory, clearTestHistory, saveResultToServer
} from './speedTestUtils';

// 导出控制器和配置
export {
  runSpeedTest, testStabilityDownloadSpeed, testStabilityUploadSpeed
} from './speedTestController';

export { testSettings, updateTestSettings } from './speedTestConfig';

// 导出常量，为避免重复导出，显式列出所需常量
export {
  DEBUG_MODE, API_BASE_URL, CDN_DOWNLOAD_URL, SPEED_TEST_SERVER,
  TEST_SIZES, HISTORY_STORAGE_KEY, TEST_DURATION_CONFIG
} from './constants';

// 对于内部模块，不直接导出
// 这些模块由speedTestController统一管理和调用
// import './downloadTest';
// import './uploadTest';
// import './stabilityTest';