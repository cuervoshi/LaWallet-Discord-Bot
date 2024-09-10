class SimpleCache {
  constructor() {
    this.cache = new Map();
  }

  set(key, value, ttl) {
    if (this.cache.has(key)) {
      clearTimeout(this.cache.get(key).timeout);
    }

    const timeout = setTimeout(() => {
      this.cache.delete(key);
    }, ttl);

    this.cache.set(key, { value, timeout });
  }

  get(key) {
    const cacheEntry = this.cache.get(key);
    return cacheEntry ? cacheEntry.value : undefined;
  }

  delete(key) {
    const cacheEntry = this.cache.get(key);
    if (cacheEntry) {
      clearTimeout(cacheEntry.timeout);
      this.cache.delete(key);
    }
  }
}

export default SimpleCache;
