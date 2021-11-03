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
 * @type {Promise<Cache>|null}
 */
const cachePromise = 'caches' in self ? caches.open('ogc-client') : null;

/**
 * @param {Object} object
 * @param {string} keys
 */
export async function storeCacheEntry(object, ...keys) {
  if (!cachePromise) return;
  const entryUrl = 'https://cache/' + keys.join('/');
  const cache = await cachePromise;
  await cache.put(
    entryUrl,
    new Response(JSON.stringify(object), {
      headers: {
        'x-expiry': (Date.now() + getCacheExpiryDuration()).toString(10),
      },
    })
  );
}

/**
 * @param {string} keys
 * @return {Promise<boolean>}
 */
export async function hasValidCacheEntry(...keys) {
  if (!cachePromise) return false;
  const entryUrl = 'https://cache/' + keys.join('/');
  const cache = await cachePromise;
  return cache
    .match(entryUrl)
    .then((req) => !!req && parseInt(req.headers.get('x-expiry')) > Date.now());
}

/**
 * @param {string} keys
 * @return {Object}
 */
export async function readCacheEntry(...keys) {
  if (!cachePromise) return null;
  const entryUrl = 'https://cache/' + keys.join('/');
  const cache = await cachePromise;
  const response = await cache.match(entryUrl);
  return response ? response.clone().json() : null;
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
  await purgeEntries();
  if (await hasValidCacheEntry(...keys)) {
    return readCacheEntry(...keys);
  }
  const taskKey = keys.join('#');
  if (tasksMap.has(taskKey)) {
    return tasksMap.get(taskKey);
  }
  const taskRun = factory();
  if (taskRun instanceof Promise) {
    taskRun.then(() => tasksMap.delete(taskKey));
    tasksMap.set(taskKey, taskRun);
  }
  const result = await taskRun;
  await storeCacheEntry(result, ...keys);
  return result;
}

/**
 * Removes all expired entries from the cache
 */
export async function purgeEntries() {
  if (!cachePromise) return;
  const cache = await cachePromise;
  const keys = await cache.keys();
  for (let key of keys) {
    const resp = await cache.match(key);
    if (parseInt(resp.headers.get('x-expiry')) <= Date.now())
      await cache.delete(key);
  }
}
