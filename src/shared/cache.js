let cacheExpiryDuration = 1000 * 60 * 60; // 1 day

/**
 * Sets a new cache expiry duration, in ms.
 * Setting this to a value <= 0 will disable the caching logic altogether
 * and not store cache entries at all
 * @param {number} value Duration in ms
 */
export function setCacheExpiryDuration(value) {
  cacheExpiryDuration = value;
}

/**
 * Returns the current cache expiry duration in ms
 * @return {number}
 */
export function getCacheExpiryDuration() {
  return cacheExpiryDuration;
}

/**
 * @param {Object} object
 * @param {string} keys
 */
export function storeCacheEntry(object, ...keys) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(
      ['OGC-CLIENT', 'VALUE', ...keys].join('#'),
      JSON.stringify(object)
    );
    window.localStorage.setItem(
      ['OGC-CLIENT', 'EXPIRY', ...keys].join('#'),
      (Date.now() + getCacheExpiryDuration()).toString(10)
    );
  } catch (e) {
    console.info(
      '[ogc-client] could not cache the latest operation (most likely due to a full storage)'
    );
  }
}

/**
 * @param {string} keys
 * @return {boolean}
 */
export function hasValidCacheEntry(...keys) {
  if (typeof window === 'undefined') {
    return false;
  }
  const time = parseInt(
    window.localStorage.getItem(['OGC-CLIENT', 'EXPIRY', ...keys].join('#'))
  );
  if (isNaN(time)) {
    return false;
  }
  return Date.now() < time;
}

/**
 * @param {string} keys
 * @return {Object}
 */
export function readCacheEntry(...keys) {
  const entry = window.localStorage.getItem(
    ['OGC-CLIENT', 'VALUE', ...keys].join('#')
  );
  return JSON.parse(entry);
}

/**
 * Map of task promises; when a promise resolves the map entry is cleared
 * @type {Map<string, Promise<Object>>}
 */
const tasksMap = new Map();

/**
 * This will skip a long/expensive task and use a cached value if available,
 * otherwise the task will be run normally
 * Note: outside of a browser's main thread, caching will never happen!
 * @param {function(): Object|Promise<Object>} factory A function encapsulating
 * the long/expensive task; non serializable properties of the returned object
 * will be set to null
 * @param {string} keys Keys will be concatenated for storage
 * @return {Promise<Object>} Resolves to either a cached object or a fresh one
 */
export async function useCache(factory, ...keys) {
  purgeEntries();
  const taskKey = keys.join('#');
  if (tasksMap.has(taskKey)) {
    return tasksMap.get(taskKey);
  }
  if (hasValidCacheEntry(...keys)) {
    return readCacheEntry(...keys);
  }
  const taskRun = factory();
  if (taskRun instanceof Promise) {
    taskRun.then(() => tasksMap.delete(taskKey));
    tasksMap.set(taskKey, taskRun);
  }
  const result = await taskRun;
  storeCacheEntry(result, ...keys);
  return result;
}

/**
 * Removes all expired entries from the cache
 */
function purgeEntries() {
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key !== null && key.startsWith('OGC-CLIENT#EXPIRY')) {
      const expiry = window.localStorage.getItem(key);
      if (expiry > Date.now()) continue;
      const valueKey = key.replace(/^OGC-CLIENT#EXPIRY/, 'OGC-CLIENT#VALUE');
      window.localStorage.removeItem(key);
      window.localStorage.removeItem(valueKey);
      i -= 2; // accomodate for the fact that we removed two entries
    }
  }
}
