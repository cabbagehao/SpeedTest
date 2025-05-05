// 网速测试工具函数

import { SpeedTestResult } from './speedTestTypes';
import { DEBUG_MODE, HISTORY_STORAGE_KEY, API_BASE_URL } from './constants';

/**
 * 创建指定大小的随机数据Blob
 * 优化版本，提高大文件生成性能
 */
export const createRandomBlob = (size: number): Blob => {
  // 对于大文件，使用分块创建方式以避免内存问题
  const CHUNK_SIZE = 1024 * 1024; // 1MB块

  if (size <= CHUNK_SIZE) {
    // 小文件直接创建
    const buffer = new Uint8Array(size);

    // 填充随机数据（只填充部分字节以提高性能）
    const randomBytes = crypto.getRandomValues(new Uint8Array(Math.min(1024, size)));
    for (let i = 0; i < size; i += randomBytes.length) {
      buffer.set(randomBytes, i % (size - randomBytes.length));
    }

    return new Blob([buffer]);
  } else {
    // 大文件分块创建
    const chunks: Uint8Array[] = [];
    const template = new Uint8Array(CHUNK_SIZE);

    // 创建随机模板数据
    crypto.getRandomValues(template.subarray(0, 1024));
    // 复制模板数据到剩余部分
    for (let i = 1024; i < CHUNK_SIZE; i += 1024) {
      template.set(template.subarray(0, Math.min(1024, CHUNK_SIZE - i)), i);
    }

    // 创建完整数据块
    const fullChunks = Math.floor(size / CHUNK_SIZE);
    const remainder = size % CHUNK_SIZE;

    // 添加完整块
    for (let i = 0; i < fullChunks; i++) {
      chunks.push(new Uint8Array(template));
    }

    // 添加剩余部分
    if (remainder > 0) {
      chunks.push(template.slice(0, remainder));
    }

    return new Blob(chunks);
  }
};

/**
 * 确定最佳测试文件大小
 * 根据初步速度测试动态确定
 */
export const determineBestFileSize = async (
  initialSpeedMbps: number,
  TEST_SIZES: any
): Promise<string> => {
  if (initialSpeedMbps < 5) {
    return TEST_SIZES.XS; // 低速连接用小文件
  } else if (initialSpeedMbps < 20) {
    return TEST_SIZES.S;  // 中速连接
  } else if (initialSpeedMbps < 50) {
    return TEST_SIZES.M;  // 高速连接
  } else if (initialSpeedMbps < 200) {
    return TEST_SIZES.L;  // 非常快的连接
  } else {
    return TEST_SIZES.XL; // 超高速连接
  }
};

/**
 * 保存测试结果到本地存储
 */
export const saveTestHistory = (result: SpeedTestResult): void => {
  try {
    // 获取现有历史
    const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    let history: SpeedTestResult[] = [];

    if (savedHistory) {
      history = JSON.parse(savedHistory);
    }

    // 添加新结果
    history.push(result);

    // 只保留最近的20条记录
    if (history.length > 20) {
      history = history.slice(-20);
    }

    // 保存回本地存储
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('保存测试历史失败:', error);
  }
};

/**
 * 获取测试历史
 */
export const getTestHistory = (): SpeedTestResult[] => {
  try {
    const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);

    if (savedHistory) {
      return JSON.parse(savedHistory);
    }

    return [];
  } catch (error) {
    console.error('获取测试历史失败:', error);
    return [];
  }
};

/**
 * 清除测试历史
 */
export const clearTestHistory = (): void => {
  localStorage.removeItem(HISTORY_STORAGE_KEY);
};

/**
 * 保存测试结果到服务器
 */
export const saveResultToServer = async (result: SpeedTestResult): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/save-result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...result,
        testType: 'basic'
      }),
    });

    if (!response.ok) {
      throw new Error(`服务器响应错误: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('保存结果到服务器失败:', error);
    throw error;
  }
};