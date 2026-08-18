/**
 * 本地持久化存储封装
 *
 * 当前使用内存实现（重启后数据丢失），适合开发调试阶段。
 *
 * ── 迁移到持久化方案 ──────────────────────────────────────────
 * 推荐：@react-native-async-storage/async-storage
 *
 * 安装：
 *   npm install @react-native-async-storage/async-storage
 *
 * 鸿蒙端适配包：
 *   https://gitee.com/react-native-oh-library/usage-docs
 *
 * 迁移步骤：
 *   1. 安装上述依赖并完成鸿蒙 link
 *   2. 将下方 MemoryDriver 替换为 AsyncStorageDriver（已准备好注释代码）
 *   3. 删除 memoryStore Map
 * ──────────────────────────────────────────────────────────────
 */

// ─── 内存驱动（当前启用） ──────────────────────────────────────────────────────

const memoryStore = new Map<string, string>();

const MemoryDriver = {
  async getItem(key: string): Promise<string | null> {
    return memoryStore.get(key) ?? null;
  },
  async setItem(key: string, value: string): Promise<void> {
    memoryStore.set(key, value);
  },
  async removeItem(key: string): Promise<void> {
    memoryStore.delete(key);
  },
  async clear(): Promise<void> {
    memoryStore.clear();
  },
  async getAllKeys(): Promise<string[]> {
    return Array.from(memoryStore.keys());
  },
};

// ─── AsyncStorage 驱动（迁移后启用，替换 MemoryDriver） ───────────────────────
//
// import AsyncStorage from '@react-native-async-storage/async-storage';
//
// const AsyncStorageDriver = {
//   getItem:    AsyncStorage.getItem.bind(AsyncStorage),
//   setItem:    AsyncStorage.setItem.bind(AsyncStorage),
//   removeItem: AsyncStorage.removeItem.bind(AsyncStorage),
//   clear:      AsyncStorage.clear.bind(AsyncStorage),
//   getAllKeys: AsyncStorage.getAllKeys.bind(AsyncStorage) as () => Promise<string[]>,
// };

// ─── 当前使用的驱动（切换时只需改这一行） ────────────────────────────────────────

const driver = MemoryDriver;

// ─── 对外暴露的存储 API ───────────────────────────────────────────────────────

export const storage = {
  /**
   * 读取并反序列化一个值
   * @returns 反序列化后的值，不存在时返回 null
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await driver.getItem(key);
      if (raw === null || raw === undefined) {
        return null;
      }
      return JSON.parse(raw) as T;
    } catch (error) {
      console.warn(`[Storage] get("${key}") failed:`, error);
      return null;
    }
  },

  /**
   * 序列化并写入一个值
   */
  async set<T>(key: string, value: T): Promise<void> {
    try {
      await driver.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`[Storage] set("${key}") failed:`, error);
    }
  },

  /**
   * 删除指定 key
   */
  async remove(key: string): Promise<void> {
    try {
      await driver.removeItem(key);
    } catch (error) {
      console.warn(`[Storage] remove("${key}") failed:`, error);
    }
  },

  /**
   * 清空所有存储
   */
  async clear(): Promise<void> {
    try {
      await driver.clear();
    } catch (error) {
      console.warn('[Storage] clear() failed:', error);
    }
  },

  /**
   * 获取所有已存储的 key
   */
  async keys(): Promise<string[]> {
    try {
      return await driver.getAllKeys();
    } catch (error) {
      console.warn('[Storage] keys() failed:', error);
      return [];
    }
  },

  /**
   * 判断某个 key 是否存在
   */
  async has(key: string): Promise<boolean> {
    const value = await driver.getItem(key);
    return value !== null;
  },
};
