/**
 * 语义化版本比对工具
 */

/**
 * 比对两个版本号（支持带 v 前缀）
 * @param v1 待比较版本 1 (例如 'v1.0.0', '1.0')
 * @param v2 待比较版本 2 (例如 'v1.0.1', '1.0.0')
 * @returns 1 如果 v1 > v2; -1 如果 v1 < v2; 0 如果 v1 === v2
 */
export function compareVersions(v1: string, v2: string): number {
  if (!v1 || !v2) return 0;

  // 剥离 'v' 或 'V' 前缀
  const cleanV1 = v1.replace(/^v/i, '');
  const cleanV2 = v2.replace(/^v/i, '');

  const parts1 = cleanV1.split('.').map(Number);
  const parts2 = cleanV2.split('.').map(Number);

  const len = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < len; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;

    if (num1 > num2) {
      return 1;
    }
    if (num1 < num2) {
      return -1;
    }
  }

  return 0;
}
