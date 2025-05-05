// WebSocket连接服务

import { SPEED_TEST_SERVER } from './constants';

// 全局WebSocket连接
let wsConnection: WebSocket | null = null;
let pingIntervalId: number | null = null;
let packetLossTestIntervalId: number | null = null;

/**
 * 初始化WebSocket连接
 */
export const initWebSocketConnection = (): Promise<WebSocket> => {
  return new Promise((resolve, reject) => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      resolve(wsConnection);
      return;
    }

    wsConnection = new WebSocket(SPEED_TEST_SERVER.wsUrl);

    wsConnection.onopen = () => {
      console.log('WebSocket连接已建立');
      resolve(wsConnection!);
    };

    wsConnection.onerror = (error) => {
      console.error('WebSocket连接错误:', error);
      wsConnection = null;
      reject(error);
    };

    wsConnection.onclose = () => {
      console.log('WebSocket连接已关闭');
      wsConnection = null;
    };
  });
};

/**
 * 关闭WebSocket连接
 */
export const closeWebSocketConnection = () => {
  if (wsConnection) {
    wsConnection.close();
    wsConnection = null;
  }

  if (pingIntervalId) {
    clearInterval(pingIntervalId);
    pingIntervalId = null;
  }

  if (packetLossTestIntervalId) {
    clearInterval(packetLossTestIntervalId);
    packetLossTestIntervalId = null;
  }
};