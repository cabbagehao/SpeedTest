// 稳定性测试服务

import { SpeedTestProgressCallback, SpeedDataPoint, StabilityTestControl } from './speedTestTypes';
import { createRandomBlob } from './speedTestUtils';
import { CDN_DOWNLOAD_URL, SPEED_TEST_SERVER, DEBUG_MODE, TEST_DURATION_CONFIG } from './constants';

/**
 * 专门用于宽带稳定性测试的下载函数
 * 持续下载直到手动停止测试，没有固定的测试时长限制
 *
 * 注意：此函数将维持固定的6个并发下载线程。当每个线程的单次下载完成后，
 * 它会记录重试计数并重新开始下载，而不是创建新的线程。
 */
export const testStabilityDownloadSpeed = async (
  onProgress: SpeedTestProgressCallback
): Promise<StabilityTestControl> => {
  // 数据点记录
  const dataPoints: SpeedDataPoint[] = [];
  onProgress('download', 0, 0, []);

  // 下载URL - 使用CDN URL而非API
  const downloadUrls = CDN_DOWNLOAD_URL; // 保留为数组

  // 间隔设置
  const INTERVAL_CHECK_MS = 500; // 速度检查间隔改为500毫秒，减少UI更新频率
  const DATA_STABILITY_THRESHOLD_SEC = TEST_DURATION_CONFIG.DATA_STABILITY_THRESHOLD_SEC; // 剔除前10秒的数据

  // 读取流优化设置
  const LOG_FREQUENCY = 5; // 每5秒输出一次详细日志，减少日志开销
  const SPEED_UPDATE_INTERVAL = 2000; // 每2秒更新一次连接速度，减少计算频率

  // 速度平滑设置
  const SPEED_SMOOTH_FACTOR = 0.5; // 平滑因子α值，新数据权重占50%
  let lastCalculatedDownloadSpeed = 0; // 上次计算的速度值，初始为0

  // 线程设置
  const TOTAL_CONNECTIONS = 1; // 固定使用1个下载线程
  const THREAD_START_DELAY_MS = 2000; // 每个线程启动间隔2秒，避免瞬时网络拥塞

  // 测试数据
  let testFinished = false; // 测试是否结束的标志
  let totalBytesDownloaded = 0; // 总下载字节数
  let activeConnections = 0; // 当前活跃连接数
  const connectionSpeedMap = new Map<number, number>(); // 记录每个连接的速度
  let lastProgressUpdate = 0; // 上次进度更新时间
  let lastLogTime = 0; // 上次日志记录时间

  // 持续测试
  const testStartTime = performance.now();
  lastProgressUpdate = testStartTime; // 初始化上次进度更新时间
  lastLogTime = testStartTime; // 初始化上次日志时间

  // 减少创建Date对象的次数
  console.log(`[StabilityDownload] 开始持续测试，将启动${TOTAL_CONNECTIONS}个线程，每个线程间隔${THREAD_START_DELAY_MS/1000}秒启动`);

  // 在测试过程中定期更新进度，降低更新频率
  const updateInterval = setInterval(() => {
    // 计算当前速度
    if (totalBytesDownloaded > 0) {
      // 获取最近一个周期内的下载速度
      // 从connectionSpeedMap获取当前所有连接的速度
      let recentSpeedMbps = 0;
      let activeConnectionsCount = 0;

      if (connectionSpeedMap.size > 0) {
        let totalSpeed = 0;
        connectionSpeedMap.forEach((speed, connId) => {
          totalSpeed += speed;
          activeConnectionsCount++;
        });

        // 计算当前总速度
        recentSpeedMbps = totalSpeed;

        // 应用平滑算法: 当前显示速度 = α×新测量值 + (1-α)×前一显示值
        if (lastCalculatedDownloadSpeed > 0) {
          recentSpeedMbps = SPEED_SMOOTH_FACTOR * recentSpeedMbps + (1 - SPEED_SMOOTH_FACTOR) * lastCalculatedDownloadSpeed;
        }

        // 更新上次计算的速度值
        lastCalculatedDownloadSpeed = recentSpeedMbps;

        // 减少日志输出频率，每5秒记录一次
        const now = performance.now();
        if (DEBUG_MODE && now - lastLogTime >= LOG_FREQUENCY * 1000) {
          // 详细记录每个连接的速度情况
          let speedDetails = '[';
          connectionSpeedMap.forEach((speed, connId) => {
            speedDetails += `(ID:${connId}=${speed.toFixed(1)}Mbps) `;
          });
          speedDetails += ']';

          console.log(`[StabilityDownload] 当前有 ${activeConnectionsCount}/${TOTAL_CONNECTIONS} 个活跃连接，单独速度: ${speedDetails}`);

          // 添加总体速度信息
          const elapsedMs = now - testStartTime;
          const overallSpeedMbps = (totalBytesDownloaded * 8) / (elapsedMs / 1000) / (1024 * 1024);
          console.log(`[StabilityDownload] 速度对比 - 总体: ${overallSpeedMbps.toFixed(2)} Mbps, 平滑实时: ${recentSpeedMbps.toFixed(2)} Mbps, 累计下载: ${(totalBytesDownloaded / (1024 * 1024)).toFixed(2)} MB, 持续: ${(elapsedMs/1000).toFixed(1)}秒`);

          lastLogTime = now;
        }
      }

      // 只有在有意义的变化时才添加数据点
      const timeSinceLastUpdate = performance.now() - lastProgressUpdate;

      if (timeSinceLastUpdate >= INTERVAL_CHECK_MS) {
        const timestamp = Date.now();
        const secondsSinceTestStart = (timestamp - testStartTime) / 1000;

        if (secondsSinceTestStart >= DATA_STABILITY_THRESHOLD_SEC) {
          const newDataPoint = {
            timestamp,
            speed: recentSpeedMbps // 使用平滑后的速度
          };

          dataPoints.push(newDataPoint);
        }

        lastProgressUpdate = performance.now();

        // 使用平滑后的速度报告给UI
        onProgress('download', 0, recentSpeedMbps, dataPoints);
      }
    } else {
      // 即使没有数据也更新进度
      onProgress('download', 0, undefined, dataPoints);
    }

    // 如果超过10秒还没有下载任何数据，可能是网络问题
    if (performance.now() - testStartTime > 10000 && totalBytesDownloaded === 0 && !testFinished) {
      console.error('[StabilityDownload] 可能存在网络问题，长时间未收到数据');
    }
  }, INTERVAL_CHECK_MS);

  /**
   * 创建一个下载任务 - 下载大文件并自动重新开始，无终止条件
   * 注意：同一个线程会在完成一次下载后重新开始下载，不会创建新的线程
   */
  const createStabilityDownloadTask = async (connectionId: number): Promise<void> => {
    if (testFinished) {
      console.log(`[StabilityDownload] 测试已标记为结束，不启动连接 #${connectionId}`);
      return;
    }

    activeConnections++;
    let retryCount = 0; // 重试计数器，从0开始
    console.log(`[StabilityDownload] 开始下载连接 #${connectionId}, 当前活跃连接: ${activeConnections}`);

    let downloadBytes = 0;
    let downloadStartTime = performance.now();
    // 记录每秒数据量，用于计算滑动窗口流量
    let lastSecondTimestamp = performance.now();
    let lastSecondBytes = 0;
    let lastSpeedUpdateTime = performance.now();

    // 持续下载直到测试结束
    try {
      while (!testFinished) {
        const cacheBuster = Date.now();

        try {
          // 根据连接ID选择下载URL
          const urlIndex = connectionId % downloadUrls.length;
          const selectedUrl = downloadUrls[urlIndex];
          console.log(`[StabilityDownload] 连接 #${connectionId} (重试 ${retryCount}) 使用URL: ${selectedUrl}`);

          // 使用有序的连接ID和重试计数
          const response = await fetch(`${selectedUrl}?id=${connectionId}&retry=${retryCount}&cb=${cacheBuster}`, {
            cache: 'no-store'
          });

          const reader = response.body?.getReader();
          if (!reader) {
            console.error(`[StabilityDownload] 连接 #${connectionId} (重试 ${retryCount}) 无法获取响应体的Reader`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒后重试
            retryCount++; // 增加重试计数
            continue;
          }

          let bytesLoaded = 0;
          const connectionStartTime = performance.now();
          let bufferSize = 0; // 当前缓冲区大小
          const MAX_BUFFER_SIZE = 1024 * 1024; // 1MB缓冲区，减少数据处理频率

          // 读取响应流，直到测试结束或文件下载完成
          try {
            while (!testFinished) {
              const { done, value } = await reader.read();

              if (done) {
                if (DEBUG_MODE) {
                  console.log(`[StabilityDownload] 连接 #${connectionId} (重试 ${retryCount}) 单次下载完成，将重新开始`);
                }
                // 计算连接速度
                const connectionDuration = (performance.now() - connectionStartTime) / 1000;
                if (connectionDuration > 0 && bytesLoaded > 0) {
                  const connectionSpeedMbps = (bytesLoaded * 8) / connectionDuration / (1024 * 1024);
                  // 使用更准确的速度值，不进行舍入
                  connectionSpeedMap.set(connectionId, connectionSpeedMbps);
                }
                retryCount++; // 增加重试计数
                break; // 单个文件下载完成，跳出内循环，外循环会重新开始下载
              }

              if (value) {
                bytesLoaded += value.length;
                downloadBytes += value.length;
                totalBytesDownloaded += value.length;
                bufferSize += value.length;

                // 更新每秒数据统计
                const now = performance.now();
                lastSecondBytes += value.length;

                // 只有在缓冲区足够大或者时间间隔足够长时才进行速度计算，减少计算频率
                if (now - lastSpeedUpdateTime >= SPEED_UPDATE_INTERVAL || bufferSize >= MAX_BUFFER_SIZE) {
                  // 计算这段时间的速度（Mbps）
                  const secondDuration = (now - lastSecondTimestamp) / 1000;
                  if (secondDuration > 0) {
                    const secondSpeedMbps = (lastSecondBytes * 8) / secondDuration / (1024 * 1024);
                    // 将这个连接的实时速度更新为最新计算的速度
                    connectionSpeedMap.set(connectionId, secondSpeedMbps);
                  }

                  // 重置计数器
                  lastSecondTimestamp = now;
                  lastSecondBytes = 0;
                  lastSpeedUpdateTime = now;
                  bufferSize = 0;

                  // 只在DEBUG模式且满足日志频率要求时记录日志
                  if (DEBUG_MODE && now - lastLogTime >= LOG_FREQUENCY * 1000) {
                    // 每1秒记录一次连接速度
                    const duration = (now - connectionStartTime) / 1000; // 秒
                    if (duration > 0 && bytesLoaded > 2 * 1024 * 1024) { // 只有下载超过2MB才记录日志
                      const avgSpeedMbps = (bytesLoaded * 8) / duration / (1024 * 1024);
                      console.log(`[StabilityDownload] 连接 #${connectionId}: ${avgSpeedMbps.toFixed(2)} Mbps, 总计: ${(totalBytesDownloaded / (1024 * 1024)).toFixed(2)} MB`);
                    }
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
              console.error(`[StabilityDownload] 连接 #${connectionId} (重试 ${retryCount}) 释放资源出错:`, e);
            }
          }

        } catch (err) {
          console.error(`[StabilityDownload] 连接 #${connectionId} (重试 ${retryCount}) 请求失败:`, err);
          retryCount++; // 增加重试计数
          // 短暂等待后继续尝试
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // 如果测试已结束，退出循环
        if (testFinished) {
          console.log(`[StabilityDownload] 连接 #${connectionId} 检测到测试已结束标志，停止下载`);
          break;
        }
      }
    } catch (error) {
      console.error(`[StabilityDownload] 连接 #${connectionId} 下载任务错误:`, error);
    } finally {
      // 计算该连接的整体速度
      const totalDuration = (performance.now() - downloadStartTime) / 1000;
      if (totalDuration > 0 && downloadBytes > 0) {
        const avgSpeedMbps = (downloadBytes * 8) / totalDuration / (1024 * 1024);
        console.log(`[StabilityDownload] 连接 #${connectionId} 结束, 共重试 ${retryCount} 次, 平均速度: ${avgSpeedMbps.toFixed(2)} Mbps, 总下载: ${(downloadBytes / (1024 * 1024)).toFixed(2)} MB`);
      }

      activeConnections--;
      connectionSpeedMap.delete(connectionId);
      console.log(`[StabilityDownload] 结束下载连接 #${connectionId}, 剩余活跃连接: ${activeConnections}`);
    }
  };

  // 按照2秒间隔启动下载线程，使用从0开始的连接ID
  console.log(`[StabilityDownload] 开始按照${THREAD_START_DELAY_MS/1000}秒间隔启动${TOTAL_CONNECTIONS}个下载线程`);
  for (let i = 0; i < TOTAL_CONNECTIONS; i++) {
    setTimeout(() => {
      if (!testFinished) {
        console.log(`[StabilityDownload] 启动第${i+1}/${TOTAL_CONNECTIONS}个下载线程, ID: ${i}`);
        createStabilityDownloadTask(i);
      } else {
        console.log(`[StabilityDownload] 测试已结束，不启动线程 #${i}`);
      }
    }, i * THREAD_START_DELAY_MS);
  }

  // 提供一个终止测试的函数
  const terminateTest = () => {
    console.log('[StabilityDownload] 测试被手动终止');
    testFinished = true; // 设置测试结束标志
    clearInterval(updateInterval); // 清除进度更新间隔
  };

  // 返回终止测试的函数和结果对象
  return {
    speed: 0, // 初始速度为0
    dataPoints: [],
    terminateTest
  };
};

/**
 * 专门用于宽带稳定性测试的上传函数
 * 持续上传直到手动停止测试，没有固定的测试时长限制
 *
 * 注意：此函数将维持固定的6个并发上传线程。当每个上传完成后，
 * 它会记录重试计数并重新开始上传，而不是创建新的线程。
 */
export const testStabilityUploadSpeed = async (
  onProgress: SpeedTestProgressCallback
): Promise<StabilityTestControl> => {
  const dataPoints: SpeedDataPoint[] = [];
  onProgress('upload', 0, 0, []);

  // 测试上传端点
  const uploadUrl = `${SPEED_TEST_SERVER.baseUrl}${SPEED_TEST_SERVER.endpoints.upload}`;

  // 间隔设置
  const INTERVAL_CHECK_MS = 200; // 速度检查间隔改为200毫秒
  const DATA_STABILITY_THRESHOLD_SEC = TEST_DURATION_CONFIG.DATA_STABILITY_THRESHOLD_SEC; // 剔除前10秒的不稳定数据

  // 速度平滑设置
  const SPEED_SMOOTH_FACTOR = 0.3; // 平滑因子α值，新数据权重占30%
  let lastCalculatedUploadSpeed = 0; // 上次计算的速度值，初始为0

  // 线程设置
  const TOTAL_CONNECTIONS = 2; // 固定使用2个上传线程
  const THREAD_START_DELAY_MS = 2000; // 每个线程间隔2秒启动，避免瞬时网络拥塞

  // 测试数据
  let testFinished = false; // 测试是否结束的标志
  let totalBytesUploaded = 0; // 总上传字节数
  let activeConnections = 0; // 当前活跃连接数
  const connectionSpeedMap = new Map<number, number>(); // 记录每个连接的速度
  let lastProgressUpdate = 0; // 上次进度更新时间

  // 持续测试
  const testStartTime = performance.now();
  lastProgressUpdate = testStartTime; // 初始化上次进度更新时间

  // 减少创建Date对象
  console.log(`[StabilityUpload] 开始持续测试，将启动${TOTAL_CONNECTIONS}个线程，每个线程间隔${THREAD_START_DELAY_MS/1000}秒启动`);

  // 在测试过程中定期更新进度
  const updateInterval = setInterval(() => {
    // 计算当前速度
    if (totalBytesUploaded > 0) {
      // 获取最近一个周期内的上传速度
      // 从connectionSpeedMap获取当前所有连接的总速度
      let recentSpeedMbps = 0;
      let activeConnectionsCount = 0;

      if (connectionSpeedMap.size > 0) {
        let totalSpeed = 0;
        // 简化日志记录，减少性能消耗
        connectionSpeedMap.forEach((speed, connId) => {
          totalSpeed += speed;
          activeConnectionsCount++;
        });

        // 只有有活跃连接才计算平均速度
        if (activeConnectionsCount > 0) {
          recentSpeedMbps = totalSpeed / activeConnectionsCount; // 使用连接的平均速度
        }

        // 应用平滑算法: 当前显示速度 = α×新测量值 + (1-α)×前一显示值
        if (lastCalculatedUploadSpeed > 0) {
          recentSpeedMbps = SPEED_SMOOTH_FACTOR * recentSpeedMbps + (1 - SPEED_SMOOTH_FACTOR) * lastCalculatedUploadSpeed;
        }

        // 更新上次计算的速度值
        lastCalculatedUploadSpeed = recentSpeedMbps;

        // 较少的日志记录
        const now = performance.now();
        const elapsedSec = (now - testStartTime) / 1000;

        // 只有经过了INTERVAL_CHECK_MS的时间才更新进度和添加数据点
        if (now - lastProgressUpdate >= INTERVAL_CHECK_MS) {
          // 添加数据点
          const newDataPoint = {
            timestamp: Date.now(),
            speed: recentSpeedMbps,
          };
          dataPoints.push(newDataPoint);

          // 计算测试进度（仅用于通知UI，无实际意义）
          // 由于是持续测试，仅显示已经经过的时间
          const progress = Math.min(1, elapsedSec / (60 * 60)); // 最多显示一小时的进度

          // 更新UI
          onProgress('upload', progress, recentSpeedMbps, [newDataPoint]);

          // 更新上次进度更新时间
          lastProgressUpdate = now;

          // 简化日志，减少性能消耗，每5秒记录一次详细日志
          if (Math.floor(elapsedSec) % 5 === 0) {
            console.log(`[StabilityUpload] 测试进行中 (${elapsedSec.toFixed(0)}秒), 当前速度: ${recentSpeedMbps.toFixed(2)} Mbps, 连接数: ${activeConnectionsCount}`);
          }
        }
      }
    }

    // 检查测试是否应该结束
    if (testFinished) {
      console.log('[StabilityUpload] 测试结束标志已设置，停止进度更新');
      clearInterval(updateInterval);
    }
  }, 100); // 更短的更新间隔，使UI更平滑，但减少操作复杂度

  /**
   * 创建一个上传任务 - 上传文件并自动重新开始，无终止条件
   * 注意：同一个线程会在完成一次上传后重新开始上传，不会创建新的线程
   */
  const createStabilityUploadTask = async (connectionId: number): Promise<void> => {
    if (testFinished) {
      console.log(`[StabilityUpload] 测试已标记为结束，不启动连接 #${connectionId}`);
      return;
    }

    activeConnections++;
    let retryCount = 0; // 重试计数器，从0开始
    console.log(`[StabilityUpload] 开始上传连接 #${connectionId}, 当前活跃连接: ${activeConnections}`);

    let uploadBytes = 0;
    let uploadStartTime = performance.now();
    // 记录每秒数据量，用于计算滑动窗口流量
    let lastSecondTimestamp = performance.now();
    let lastSecondBytes = 0;

    // 持续上传直到测试结束
    try {
      while (!testFinished) {
        try {
          // 生成当前时间戳作为缓存破坏参数
          const cacheBuster = Date.now();

          // 创建一个大文件用于上传测试 - 10MB
          const fileSize = 10 * 1024 * 1024; // 10MB大小文件
          const randomData = new Uint8Array(fileSize);

          // 生成随机数据
          for (let i = 0; i < fileSize; i++) {
            randomData[i] = Math.floor(Math.random() * 256);
          }

          const blob = new Blob([randomData], { type: 'application/octet-stream' });
          const file = new File([blob], `upload_test_${connectionId}_${retryCount}_${cacheBuster}.dat`, {
            type: 'application/octet-stream',
          });

          // 准备FormData
          const formData = new FormData();
          formData.append('file', file);

          // 设置URL参数 - 使用SPEED_TEST_SERVER常量
          const uploadEndpoint = `${SPEED_TEST_SERVER.baseUrl}${SPEED_TEST_SERVER.endpoints.upload}?id=${connectionId}&retry=${retryCount}&cb=${cacheBuster}`;
          console.log(`[StabilityUpload] 连接 #${connectionId} (重试 ${retryCount}) 使用上传URL: ${uploadEndpoint}`);

          // 使用Promise包装XHR请求，以便更好地控制上传过程
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const connectionStartTime = performance.now();
            let bytesUploaded = 0;

            // 打开连接
            xhr.open('POST', uploadEndpoint);

            // 设置进度回调
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                bytesUploaded = event.loaded;

                // 更新每秒数据统计
                const now = performance.now();
                lastSecondBytes += event.loaded - lastSecondBytes;

                // 如果经过了一秒，计算这一秒的速度
                if (now - lastSecondTimestamp >= 1000) {
                  const secondDuration = (now - lastSecondTimestamp) / 1000;
                  // 计算这一秒的速度（Mbps）
                  const secondSpeedMbps = (lastSecondBytes * 8) / secondDuration / (1024 * 1024);

                  // 将这个连接的实时速度更新为最新一秒的速度
                  connectionSpeedMap.set(connectionId, secondSpeedMbps);

                  // 重置计数器
                  lastSecondTimestamp = now;
                  lastSecondBytes = 0;

                  // 每秒记录一次连接速度 - 仅在数据量足够大时记录
                  if (bytesUploaded > 1024 * 1024) {
                    const duration = (now - connectionStartTime) / 1000; // 秒
                    const avgSpeedMbps = (bytesUploaded * 8) / duration / (1024 * 1024);

                    // 简化日志输出
                    console.log(`[StabilityUpload] 连接 #${connectionId}: ${secondSpeedMbps.toFixed(2)} Mbps, 进度: ${Math.round(bytesUploaded * 100 / fileSize)}%`);
                  }
                }
              }
            };

            // 完成回调
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                // 上传成功
                const connectionDuration = (performance.now() - connectionStartTime) / 1000;
                if (connectionDuration > 0 && bytesUploaded > 0) {
                  const connectionSpeedMbps = (bytesUploaded * 8) / connectionDuration / (1024 * 1024);
                  connectionSpeedMap.set(connectionId, connectionSpeedMbps);

                  uploadBytes += bytesUploaded;
                  totalBytesUploaded += bytesUploaded;
                }
                resolve();
              } else {
                // 上传失败
                reject(new Error(`HTTP错误: ${xhr.status}`));
              }
            };

            // 错误处理
            xhr.onerror = () => {
              reject(new Error('网络请求错误'));
            };

            xhr.ontimeout = () => {
              reject(new Error('上传请求超时'));
            };

            // 如果测试已经停止，中止上传
            const checkInterval = setInterval(() => {
              if (testFinished) {
                try {
                  xhr.abort();
                  clearInterval(checkInterval);
                  reject(new Error('测试已停止'));
                } catch (e) {
                  // 忽略中止错误
                }
              }
            }, 100);

            xhr.onabort = () => {
              clearInterval(checkInterval);
              reject(new Error('上传已中止'));
            };

            // 发送请求
            xhr.send(formData);
          });

          // 单次上传成功完成，记录重试次数并准备下一次
          retryCount++;
          console.log(`[StabilityUpload] 连接 #${connectionId} (重试 ${retryCount-1}) 单次上传完成，将重新开始`);

        } catch (error) {
          console.error(`[StabilityUpload] 连接 #${connectionId} (重试 ${retryCount}) 上传失败:`, error);
          retryCount++; // 增加重试计数
          // 短暂等待后继续尝试
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // 如果测试已结束，退出循环
        if (testFinished) {
          console.log(`[StabilityUpload] 连接 #${connectionId} 检测到测试已结束标志，停止上传`);
          break;
        }
      }
    } catch (error) {
      console.error(`[StabilityUpload] 连接 #${connectionId} 上传任务错误:`, error);
    } finally {
      // 计算该连接的整体速度
      const totalDuration = (performance.now() - uploadStartTime) / 1000;
      if (totalDuration > 0 && uploadBytes > 0) {
        const avgSpeedMbps = (uploadBytes * 8) / totalDuration / (1024 * 1024);
        console.log(`[StabilityUpload] 连接 #${connectionId} 结束, 共尝试 ${retryCount} 次, 平均速度: ${avgSpeedMbps.toFixed(2)} Mbps, 总上传: ${(uploadBytes / (1024 * 1024)).toFixed(2)} MB`);
      }

      activeConnections--;
      connectionSpeedMap.delete(connectionId);
      console.log(`[StabilityUpload] 结束上传连接 #${connectionId}, 剩余活跃连接: ${activeConnections}`);
    }
  };

  // 按照间隔启动上传线程，使用从0开始的连接ID
  console.log(`[StabilityUpload] 开始按照${THREAD_START_DELAY_MS/1000}秒间隔启动${TOTAL_CONNECTIONS}个上传线程`);
  for (let i = 0; i < TOTAL_CONNECTIONS; i++) {
    setTimeout(() => {
      if (!testFinished) {
        console.log(`[StabilityUpload] 启动第${i+1}/${TOTAL_CONNECTIONS}个上传线程, ID: ${i}`);
        createStabilityUploadTask(i);
      } else {
        console.log(`[StabilityUpload] 测试已结束，不启动线程 #${i}`);
      }
    }, i * THREAD_START_DELAY_MS);
  }

  // 提供一个终止测试的函数
  const terminateTest = () => {
    console.log('[StabilityUpload] 测试被手动终止');
    testFinished = true; // 设置测试结束标志
    clearInterval(updateInterval); // 清除进度更新间隔
  };

  // 返回终止测试的函数和结果对象
  return {
    speed: 0, // 初始速度为0
    dataPoints: [],
    terminateTest
  };
};