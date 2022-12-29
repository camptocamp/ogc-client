/**
 * Sets a new cache expiry duration, in ms.
 * Setting this to a value <= 0 will disable the caching logic altogether
 * and not store cache entries at all
 * @param {number} value Duration in ms
 */
export function setCacheExpiryDuration(value: number): void;
/**
 * Returns the current cache expiry duration in ms
 * @return {number}
 */
export function getCacheExpiryDuration(): number;
/**
 * @param {Object} object
 * @param {string} keys
 */
export function storeCacheEntry(object: any, ...keys: string): Promise<void>;
/**
 * @param {string} keys
 * @return {Promise<boolean>}
 */
export function hasValidCacheEntry(...keys: string): Promise<boolean>;
/**
 * @param {string} keys
 * @return {Object}
 */
export function readCacheEntry(...keys: string): any;
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
export function useCache(factory: () => any | Promise<any>, ...keys: string): Promise<any>;
/**
 * Removes all expired entries from the cache
 */
export function purgeEntries(): Promise<void>;
