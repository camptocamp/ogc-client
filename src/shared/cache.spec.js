import {
  hasValidCacheEntry,
  readCacheEntry,
  setCacheExpiryDuration,
  storeCacheEntry,
  useCache,
} from './cache';

const factory = jest.fn(() => ({ fresh: true }));
let NOW;
Date.now = () => NOW;

describe('cache utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    NOW = 10000;
    setCacheExpiryDuration(1000);
  });
  describe('useCache', () => {
    describe('when no cache entry is present', () => {
      let result;
      beforeEach(async () => {
        result = await useCache(factory, 'test', 'entry', '01');
      });
      it('runs the factory function', () => {
        expect(factory).toHaveBeenCalledTimes(1);
      });
      it('returns the produced object', () => {
        expect(result).toEqual({ fresh: true });
      });
    });
    describe('when an expired cache entry is present', () => {
      let result;
      beforeEach(async () => {
        storeCacheEntry({ old: true }, 'test', 'entry', '02');
        NOW = 12000;
        result = await useCache(factory, 'test', 'entry', '02');
      });
      it('runs the factory function', () => {
        expect(factory).toHaveBeenCalledTimes(1);
      });
      it('returns the produced object', () => {
        expect(result).toEqual({ fresh: true });
      });
    });
    describe('when a valid cache entry is present', () => {
      let result;
      beforeEach(async () => {
        storeCacheEntry({ old: true }, 'test', 'entry', '03');
        NOW = 10800;
        result = await useCache(factory, 'test', 'entry', '03');
      });
      it('does not run the factory function', () => {
        expect(factory).not.toHaveBeenCalled();
      });
      it('returns the cached object', () => {
        expect(result).toEqual({ old: true });
      });
    });
    describe('when no cache entry is present but a similar task is already running', () => {
      let result, longTask, produced;
      beforeEach(async () => {
        produced = { fresh: true };
        longTask = jest.fn(
          () =>
            new Promise((resolve) => {
              setTimeout(() => {
                resolve(produced);
              }, 10);
            })
        );
        useCache(longTask, 'test', 'entry', '04');
        result = await useCache(longTask, 'test', 'entry', '04');
      });
      it('does not run the factory function again', () => {
        expect(longTask).toHaveBeenCalledTimes(1);
      });
      it('returns the object from the existing run', () => {
        expect(result).toBe(produced);
      });
    });
    describe('when an expired cache entry is present (as well as unrelated entries) and a new cache entry is set', () => {
      let result;
      beforeEach(async () => {
        window.localStorage.setItem('unrelated-1', 'unrelated');
        storeCacheEntry({ old: true }, 'test', 'entry', '04');
        window.localStorage.setItem('unrelated-2', 'unrelated');
        NOW = 11200;
        result = await useCache(factory, 'test', 'entry', '05');
      });
      it('deletes the expired cache entry', () => {
        expect(readCacheEntry('test', 'entry', '04')).toBeNull();
      });
      it('preservs unrelated entries', () => {
        expect(window.localStorage.getItem('unrelated-1')).toEqual('unrelated');
        expect(window.localStorage.getItem('unrelated-2')).toEqual('unrelated');
      });
    });
    describe('when saving the result in the cache fails (i.e. no space left)', () => {
      let result;
      beforeEach(async () => {
        jest
          .spyOn(window.localStorage.__proto__, 'setItem')
          .mockImplementation(() => {
            throw new Error('no more room');
          });
        result = await useCache(factory, 'test', 'entry', '06');
      });
      it('runs the task without error', () => {
        expect(result).toEqual({ fresh: true });
      });
      it('does not save anything in cache', () => {
        expect(hasValidCacheEntry('test', 'entry', '06')).toBeFalsy();
      });
    });
  });
});
