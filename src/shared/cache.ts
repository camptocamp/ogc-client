let cacheExpiryDuration = 1000 * 60 * 60; // 1 day

/**
 * Sets a new cache expiry duration, in ms.
 * Setting this to a value <= 0 will disable the caching logic altogether
 * and not store cache entries at all
 * @param value Duration in ms
 */
export function setCacheExpiryDuration(value: number) {
  cacheExpiryDuration = value;
}

/**
 * Returns the current cache expiry duration in ms
 */
export function getCacheExpiryDuration() {
  return cacheExpiryDuration;
}

let cachePromise: Promise<Cache | null>;
function getCache() {
  if (cachePromise !== undefined) return cachePromise;
  if (!('caches' in globalThis)) {
    cachePromise = Promise.resolve(null);
    return cachePromise;
  }
  cachePromise = caches.open('ogc-client').catch((e) => {
    console.info(
      '[ogc-client] Cache could not be accessed for the following reason:',
      e
    );
    return null;
  });
  return cachePromise;
}

// use only in tests
export function _resetCache() {
  cachePromise = undefined;
}

export async function storeCacheEntry(object: unknown, ...keys: string[]) {
  const cache = await getCache();
  if (!cache) return;
  const entryUrl = 'https://cache/' + keys.join('/');
  await cache.put(
    entryUrl,
    new Response(JSON.stringify(object), {
      headers: {
        'x-expiry': (Date.now() + getCacheExpiryDuration()).toString(10),
      },
    })
  );
}

export async function hasValidCacheEntry(...keys: string[]) {
  const cache = await getCache();
  if (!cache) return;
  const entryUrl = 'https://cache/' + keys.join('/');
  return cache
    .match(entryUrl)
    .then((req) => !!req && parseInt(req.headers.get('x-expiry')) > Date.now());
}

export async function readCacheEntry(...keys: string[]) {
  const cache = await getCache();
  if (!cache) return;
  const entryUrl = 'https://cache/' + keys.join('/');
  const response = await cache.match(entryUrl);
  return response ? response.clone().json() : null;
}

/**
 * Map of task promises; when a promise resolves the map entry is cleared
 */
const tasksMap: Map<string, Promise<unknown>> = new Map();

/**
 * This will skip a long/expensive task and use a cached value if available,
 * otherwise the task will be run normally
 * Note: outside of a browser's main thread, caching will never happen!
 * @param factory A function encapsulating
 * the long/expensive task; non-serializable properties of the returned object
 * will be set to null
 * @param keys Keys will be concatenated for storage
 * @return Resolves to either a cached object or a fresh one
 */
export async function useCache<T>(
  factory: () => T | Promise<T>,
  ...keys: string[]
): Promise<T> {
  await purgeEntries();
  if (await hasValidCacheEntry(...keys)) {
    return readCacheEntry(...keys);
  }
  const taskKey = keys.join('#');
  if (tasksMap.has(taskKey)) {
    return tasksMap.get(taskKey) as T;
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
  const cache = await getCache();
  if (!cache) return;
  const keys = await cache.keys();
  for (const key of keys) {
    const resp = await cache.match(key);
    if (parseInt(resp.headers.get('x-expiry')) <= Date.now())
      await cache.delete(key);
  }
}
