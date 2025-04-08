/**
 * 全局限速设置
 * 仅用于开发模式下的测试
 */
export const throttleSettings = {
  enabled: false,
  throttleKBps: 0,
  fileSize: 's'
};

/**
 * 更新全局限速设置
 */
export const updateThrottleSettings = (
  enabled: boolean, 
  throttleKBps: number, 
  fileSize: string
): void => {
  throttleSettings.enabled = enabled;
  // 将KB/s转换为Kbps (1Byte = 8bits)
  throttleSettings.throttleKBps = enabled ? throttleKBps : 0;
  throttleSettings.fileSize = fileSize;
  
  // 输出当前设置到控制台
  if (import.meta.env.MODE === 'development') {
    if (enabled) {
      console.log(`[限速测试] 已启用限速: ${throttleKBps} KB/s (${throttleKBps * 8} Kbps), 文件大小: ${fileSize}`);
    } else {
      console.log('[限速测试] 已禁用限速');
    }
  }
}; 