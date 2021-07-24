let cacheExpiryDuration = 1000 * 60 * 60; // 1 day

/**
 * Sets a new cache expiry duration, in ms.
 * This *will* affect existing cache entries, as entries are stored
 * relative to the request time; as such, increasing the expiry duration
 * will make existing entries last longer.
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
    throw new Error('Caching not available in workers');
  }
  window.localStorage.setItem(
    ['VALUE', ...keys].join('#'),
    JSON.stringify(object)
  );
  window.localStorage.setItem(
    ['TIME', ...keys].join('#'),
    Date.now().toString(10)
  );
}

/**
 * @param {string} keys
 * @return {boolean}
 */
export function hasValidCacheEntry(...keys) {
  const time = parseInt(
    window.localStorage.getItem(['TIME', ...keys].join('#'))
  );
  if (isNaN(time)) {
    return false;
  }
  return Date.now() < time + getCacheExpiryDuration();
}

/**
 * @param {string} keys
 * @return {Object}
 */
function readCacheEntry(...keys) {
  const entry = window.localStorage.getItem(['VALUE', ...keys].join('#'));
  return JSON.parse(entry);
}

/**
 * Map of task promises; when a promise resolves the map entry is cleared
 * @type {Map<string, Promise<Object>>}
 */
const tasksMap = new Map();

/**
 * Returns a promise equivalent to `fetch(url)` but guarded against
 * identical concurrent requests
 * @param {string} url
 * @return {Promise<Response>}
 */
function sharedFetch(url) {
  if (fetchPromises.has(url)) {
    return fetchPromises.get(url);
  }
  const promise = fetch(url);
  promise.then(() => fetchPromises.delete(url));
  fetchPromises.set(url, promise);
  return promise;
}

/**
 * This will skip a long/expensive task and use a cached value if available,
 * otherwise the task will be run normally
 * @param {function(): Object|Promise<Object>} factory A function encapsulating
 * the long/expensive task; non serializable properties of the returned object
 * will be set to null
 * @param {string} keys Keys will be concatenated for storage
 * @return {Promise<Object>} Resolves to either a cached object or a fresh one
 */
export async function useCache(factory, ...keys) {
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
