// 下载速度测试服务

import { SpeedTestProgressCallback, SpeedDataPoint, StabilityTestControl } from './speedTestTypes';
import { createRandomBlob } from './speedTestUtils';
import { CDN_DOWNLOAD_URL, DEBUG_MODE, TEST_DURATION_CONFIG } from './constants';
import { testSettings } from './speedTestConfig';

/**
 * 测试下载速度 - 改进版本，持续测试用户设定的时间，动态调整下载线程
 */
export const testDownloadSpeed = async (
  onProgress: SpeedTestProgressCallback,
  isStabilityTest: boolean = false // 添加参数，用于区分是否为稳定性测试
): Promise<{ speed: number | null; dataPoints: SpeedDataPoint[] }> => {
  // 数据点记录
  const dataPoints: SpeedDataPoint[] = [];

  // 下载URL - 使用CDN URL而非API
  const downloadUrl = CDN_DOWNLOAD_URL;

  // 从测试设置获取时间配置
  const TEST_DURATION_MS = testSettings.downloadTestDuration.min; // 固定15秒
  const MIN_DATA_POINTS = TEST_DURATION_CONFIG.MIN_DATA_POINTS; // 最小数据点数量
  const INTERVAL_CHECK_MS = TEST_DURATION_CONFIG.INTERVAL_CHECK_MS; // 速度检查间隔
  const DATA_STABILITY_THRESHOLD_SEC = TEST_DURATION_CONFIG.DATA_STABILITY_THRESHOLD_SEC; // 剔除前2秒的数据

  // 测试控制变量
  let testFinished = false;
  let activeConnections = 0; // 活跃连接数
  let totalBytesDownloaded = 0;
  let connectionSpeedMap = new Map<number, number>(); // 记录每个连接的速度

  // 下载线程配置
  const INITIAL_CONNECTIONS = 3; // 初始下载线程数
  const MAX_CONNECTIONS = 10;    // 最大下载线程数
  let currentConnectionCount = INITIAL_CONNECTIONS;
  let lastSpeedCheck = 0;
  let lastOverallSpeed = 0;
  let lastProgressUpdate = 0; // 上次进度更新时间

  // 添加硬超时保障，确保测试不会无限进行
  const hardTimeoutId = setTimeout(() => {
    if (!testFinished) {
      console.warn('[Download] 硬超时触发，强制结束测试');
      testFinished = true;
    }
  }, TEST_DURATION_MS + 5000); // 测试时间 + 5秒缓冲

  // 预热连接
  onProgress('download', 0, 0, []);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    await fetch(`${downloadUrl}?cb=${Date.now()}`, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
  } catch (error) {
    console.error('预热连接失败:', error);
    // 即使预热失败也继续测试
  }

  // 初始测试 - 确定连接速度范围
  onProgress('download', 5, undefined, dataPoints);
  let initialSpeed = 0;

  try {
    const cacheBuster = Date.now();
    const startTime = performance.now();

    // 使用短超时进行初始测试
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${downloadUrl}?cb=${cacheBuster}`, {
      cache: 'no-store',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // 流式获取一部分数据来计算初始速度
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法获取响应流');
    }

    let bytesReceived = 0;
    const sampleStartTime = performance.now();
    const sampleDuration = 2000; // 采样2秒

    // 采样下载速度
    while (performance.now() - sampleStartTime < sampleDuration) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        bytesReceived += value.length;
      }
    }

    // 释放读取器，因为我们只需要采样
    reader.releaseLock();
    try {
      // 终止流下载
      response.body?.cancel();
    } catch (e) {
      console.log('取消流下载时出错', e);
    }

    const sampleEndTime = performance.now();
    const sampleDurationSec = (sampleEndTime - sampleStartTime) / 1000;

    if (sampleDurationSec > 0 && bytesReceived > 0) {
      const bitsReceived = bytesReceived * 8;
      initialSpeed = bitsReceived / sampleDurationSec / (1024 * 1024);

      // 添加数据点
      dataPoints.push({
        timestamp: Date.now(),
        speed: initialSpeed
      });

      onProgress('download', 10, initialSpeed, dataPoints);
    } else {
      // 如果采样失败，使用保守估计
      initialSpeed = 5; // 假设5Mbps
      onProgress('download', 10, initialSpeed, dataPoints);
    }
  } catch (error) {
    console.error('初始速度测试失败:', error);
    // 如果初始测试失败，使用保守的默认值
    initialSpeed = 5; // 假设5Mbps
    onProgress('download', 10, initialSpeed, dataPoints);
  }

  // 持续测试 - 使用多个连接下载大文件，动态调整连接数
  const testStartTime = performance.now();
  lastProgressUpdate = testStartTime; // 初始化上次进度更新时间
  const speedSamples: number[] = [];

  console.log(`[Download] 开始持续测试，时间: ${new Date().toISOString()}, 初始连接数: ${INITIAL_CONNECTIONS}`);

  // 在测试过程中定期更新进度
  const updateInterval = setInterval(() => {
    const elapsedMs = performance.now() - testStartTime;
    const progressPercent = Math.min(95, (elapsedMs / TEST_DURATION_MS) * 95); // 简化进度计算

    // 计算当前速度
    if (elapsedMs > 0 && totalBytesDownloaded > 0) {
      // 计算当前总体速度
      let currentSpeedMbps = (totalBytesDownloaded * 8) / (elapsedMs / 1000) / (1024 * 1024);

      // 只有在有意义的变化时才添加数据点
      const lastPoint = dataPoints[dataPoints.length - 1];
      const timeSinceLastUpdate = performance.now() - lastProgressUpdate;

      if (timeSinceLastUpdate >= INTERVAL_CHECK_MS) {
        const timestamp = Date.now();

        // 只有测试开始2秒后的数据才会被添加到样本中(稳定期数据)
        const secondsSinceTestStart = (timestamp - testStartTime) / 1000;

        if (secondsSinceTestStart >= DATA_STABILITY_THRESHOLD_SEC) {
          const newDataPoint = {
            timestamp,
            speed: currentSpeedMbps
          };

          dataPoints.push(newDataPoint);
          speedSamples.push(currentSpeedMbps);

          // 动态调整下载线程数量
          if (secondsSinceTestStart > 5 && // 测试开始5秒后才考虑增加线程
              elapsedMs - lastSpeedCheck > 1000 && // 每秒最多调整一次
              currentConnectionCount < MAX_CONNECTIONS) { // 未达到最大线程数

            lastSpeedCheck = elapsedMs;

            // 检查速度是否有提升
            if (currentSpeedMbps > lastOverallSpeed * 1.1) { // 速度提升超过10%
              // 增加下载线程
              const newThreads = Math.min(2, MAX_CONNECTIONS - currentConnectionCount); // 每次最多增加2个线程
              if (newThreads > 0) {
                console.log(`[Download] 检测到带宽未饱和，增加${newThreads}个下载线程，当前速度: ${currentSpeedMbps.toFixed(2)} Mbps`);

                // 启动新的下载线程
                for (let i = 0; i < newThreads; i++) {
                  currentConnectionCount++;
                  createDownloadTask();
                }
              }
            }

            lastOverallSpeed = currentSpeedMbps;
          }
        }

        lastProgressUpdate = performance.now();
      }

      onProgress('download', progressPercent, currentSpeedMbps, dataPoints);
    } else {
      // 即使没有数据也更新进度
      onProgress('download', progressPercent, undefined, dataPoints);
    }

    // 检查是否达到测试时间
    if (elapsedMs >= TEST_DURATION_MS && !testFinished) {
      console.log(`[Download] 达到测试时间 ${TEST_DURATION_MS/1000}秒，结束测试`);
      testFinished = true;
      clearInterval(updateInterval);
    }

    // 如果长时间没有下载数据，可能卡住了
    if (elapsedMs > 5000 && totalBytesDownloaded === 0 && !testFinished) {
      console.warn('[Download] 可能卡住了，没有数据被下载');
    }

    // 如果超过10秒还没有下载任何数据，提早结束测试
    if (elapsedMs > 10000 && totalBytesDownloaded === 0 && !testFinished) {
      console.error('[Download] 测试卡住了，提早终止');
      testFinished = true;
      clearInterval(updateInterval);
    }
  }, INTERVAL_CHECK_MS);

  // 创建一个下载任务 - 下载大文件并自动重新开始
  const createDownloadTask = async (): Promise<void> => {
    if (testFinished) return;

    activeConnections++;
    const connectionId = Math.floor(Math.random() * 10000);
    console.log(`[Download] 开始下载连接 #${connectionId}, 当前活跃连接: ${activeConnections}`);

    let downloadBytes = 0;
    let downloadStartTime = performance.now();

    // 持续下载直到测试结束
    try {
      while (!testFinished) {
        const cacheBuster = Date.now() + '-' + Math.random();
        const controller = new AbortController();

        // 设置超时以防卡住，仅在非稳定性测试时应用
        let timeoutId: number | null = null;
        if (!isStabilityTest) {
          timeoutId = window.setTimeout(() => {
            controller.abort();
            console.warn(`[Download] 连接 #${connectionId} 请求超时，已中止`);
          }, 8000); // 8秒超时
        }

        try {
          // 使用CDN URL进行下载
          const response = await fetch(`${downloadUrl}?cb=${cacheBuster}`, {
            cache: 'no-store',
            signal: controller.signal
          });

          // 清除超时，如果有设置的话
          if (timeoutId !== null) {
            clearTimeout(timeoutId);
          }

          if (!response.ok) {
            console.error(`[Download] 连接 #${connectionId} 响应错误:`, response.status);
            break;
          }

          // 获取响应体流
          const reader = response.body?.getReader();

          if (!reader) {
            console.error(`[Download] 连接 #${connectionId} 无法获取响应体的Reader`);
            break;
          }

          let bytesLoaded = 0;
          const connectionStartTime = performance.now();

          // 读取响应流，直到测试结束或文件下载完成
          try {
            while (!testFinished) {
              const { done, value } = await reader.read();

              if (done) {
                console.log(`[Download] 连接 #${connectionId} 单次下载完成，将重新开始`);
                // 计算连接速度
                const connectionDuration = (performance.now() - connectionStartTime) / 1000;
                if (connectionDuration > 0 && bytesLoaded > 0) {
                  const connectionSpeedMbps = (bytesLoaded * 8) / connectionDuration / (1024 * 1024);
                  connectionSpeedMap.set(connectionId, connectionSpeedMbps);
                }
                break; // 单个文件下载完成，跳出内循环，外循环会重新开始下载
              }

              if (value) {
                bytesLoaded += value.length;
                downloadBytes += value.length;
                totalBytesDownloaded += value.length;

                // 每1秒更新一次连接速度
                const now = performance.now();
                if (now - connectionStartTime > 1000) {
                  const duration = (now - connectionStartTime) / 1000; // 秒
                  const connectionSpeedMbps = (bytesLoaded * 8) / duration / (1024 * 1024);
                  connectionSpeedMap.set(connectionId, connectionSpeedMbps);

                  // 记录调试信息
                  if (DEBUG_MODE && Math.random() < 0.05) { // 5%的概率记录日志
                    console.log(`[Download] 连接 #${connectionId} 速度: ${connectionSpeedMbps.toFixed(2)} Mbps, 已下载: ${(bytesLoaded / (1024 * 1024)).toFixed(2)} MB`);
                  }
                }
              }
            }
          } finally {
            // 确保资源被释放
            try {
              reader.releaseLock();
              response.body?.cancel();
            } catch (e) {
              console.error(`[Download] 连接 #${connectionId} 释放资源出错:`, e);
            }
          }

        } catch (err) {
          console.error(`[Download] 连接 #${connectionId} 请求失败:`, err);
          // 短暂等待后继续尝试
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // 如果测试已结束，退出循环
        if (testFinished) break;
      }
    } catch (error) {
      console.error(`[Download] 连接 #${connectionId} 下载任务错误:`, error);
    } finally {
      // 计算该连接的整体速度
      const totalDuration = (performance.now() - downloadStartTime) / 1000;
      if (totalDuration > 0 && downloadBytes > 0) {
        const avgSpeedMbps = (downloadBytes * 8) / totalDuration / (1024 * 1024);
        console.log(`[Download] 连接 #${connectionId} 结束, 平均速度: ${avgSpeedMbps.toFixed(2)} Mbps, 总下载: ${(downloadBytes / (1024 * 1024)).toFixed(2)} MB`);
      }

      activeConnections--;
      connectionSpeedMap.delete(connectionId);
      console.log(`[Download] 结束下载连接 #${connectionId}, 剩余活跃连接: ${activeConnections}`);
    }
  };

  // 启动初始下载线程
  console.log(`[Download] 启动${INITIAL_CONNECTIONS}个初始下载线程`);
  for (let i = 0; i < INITIAL_CONNECTIONS; i++) {
    createDownloadTask();
  }

  // 定义测试结束条件
  const testEndPromise = new Promise<void>((resolve) => {
    const checkInterval = setInterval(() => {
      const elapsedMs = performance.now() - testStartTime;

      // 已达到测试时间且有足够的数据点
      if (elapsedMs >= TEST_DURATION_MS && dataPoints.length >= MIN_DATA_POINTS) {
        console.log(`[Download] 达到测试条件: ${(elapsedMs/1000).toFixed(1)}秒, ${dataPoints.length}个数据点`);
        testFinished = true;
        clearInterval(checkInterval);
        resolve();
      }
      // 达到测试时间但数据点不足
      else if (elapsedMs >= TEST_DURATION_MS) {
        console.log(`[Download] 达到测试时间: ${(elapsedMs/1000).toFixed(1)}秒，但只有${dataPoints.length}个数据点`);
        testFinished = true;
        clearInterval(checkInterval);
        resolve();
      }
    }, 500);
  });

  // 设置最大总测试时间（保险措施）
  const maxTestTimePromise = new Promise<void>((resolve) => {
    setTimeout(() => {
      if (!testFinished) {
        console.warn('[Download] 达到最大总测试时间限制，强制结束测试');
        testFinished = true;
        resolve();
      }
    }, TEST_DURATION_MS + 3000); // 测试时间 + 3秒缓冲
  });

  // 等待测试结束
  await Promise.race([
    testEndPromise,
    maxTestTimePromise
  ]);

  // 确保更新间隔已清除
  clearInterval(updateInterval);
  clearTimeout(hardTimeoutId);

  // 主动终止测试
  testFinished = true;

  // 分析数据，计算最终速度
  const testDurationSec = (performance.now() - testStartTime) / 1000;
  console.log(`[Download] 测速完成，总测试时间: ${testDurationSec.toFixed(2)}秒, 总下载: ${(totalBytesDownloaded / (1024 * 1024)).toFixed(2)} MB, 最大使用线程数: ${currentConnectionCount}`);

  // 使用多种统计方法计算速度
  let finalSpeed: number | null = null;

  if (totalBytesDownloaded === 0) {
    console.error('[Download] 测试失败：没有下载任何数据');
    return { speed: null, dataPoints: [] };
  }

  // 获取稳定期的数据点（剔除前几秒的数据）
  const stableDataPoints = dataPoints.filter(point =>
    (point.timestamp - testStartTime) / 1000 >= DATA_STABILITY_THRESHOLD_SEC
  );

  console.log(`[Download] 总数据点: ${dataPoints.length}, 稳定期数据点: ${stableDataPoints.length}`);

  if (stableDataPoints.length > 0) {
    // 方法1: 从稳定期总字节数和总时间计算
    const overallSpeedMbps = (totalBytesDownloaded * 8) / testDurationSec / (1024 * 1024);

    // 方法2: 稳定区间内的平均速度（排除异常值）
    let stableSpeedSamples = stableDataPoints.map(point => point.speed);
    if (stableSpeedSamples.length >= 8) {
      // 排序后去除最低的10%和最高的10%的样本
      stableSpeedSamples = [...stableSpeedSamples].sort((a, b) => a - b);
      const lowCutoff = Math.floor(stableSpeedSamples.length * 0.1);
      const highCutoff = Math.floor(stableSpeedSamples.length * 0.9);
      stableSpeedSamples = stableSpeedSamples.slice(lowCutoff, highCutoff);
    }

    const avgStableSpeed = stableSpeedSamples.reduce((sum, speed) => sum + speed, 0) / stableSpeedSamples.length;

    console.log(`[Download] 整体速度: ${overallSpeedMbps.toFixed(2)} Mbps, 稳定区间平均: ${avgStableSpeed.toFixed(2)} Mbps`);

    // 最终使用稳定区间内的平均速度作为结果
    finalSpeed = Number(avgStableSpeed.toFixed(2));
  } else if (totalBytesDownloaded > 0) {
    // 如果没有稳定期数据点但有下载数据，直接用总量计算
    finalSpeed = Number(((totalBytesDownloaded * 8) / testDurationSec / (1024 * 1024)).toFixed(2));
  }

  onProgress('download', 100, finalSpeed || 0, dataPoints);

  return {
    speed: finalSpeed,
    dataPoints: dataPoints.length > 0 ? dataPoints : [
      { timestamp: Date.now() - 1000, speed: finalSpeed || 0 },
      { timestamp: Date.now(), speed: finalSpeed || 0 }
    ]
  };
};