// 简单的内存缓存工具
class Cache {
  constructor(ttl = 3600) {
    this.cache = {};
    this.ttl = ttl * 1000; // 转换为毫秒
  }

  set(key, value) {
    this.cache[key] = {
      value,
      timestamp: Date.now()
    };
  }

  get(key) {
    const item = this.cache[key];
    if (!item) return null;
    
    // 检查是否过期
    if (Date.now() - item.timestamp > this.ttl) {
      delete this.cache[key];
      return null;
    }
    
    return item.value;
  }

  clear() {
    this.cache = {};
  }
}

module.exports = Cache; 