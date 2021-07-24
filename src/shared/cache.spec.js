import { setCacheExpiryDuration, storeCacheEntry, useCache } from './cache';

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
  });
});
