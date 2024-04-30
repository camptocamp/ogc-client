import { getParentPath } from './link-utils.js';

describe('link utils', () => {
  describe('getParentPath', () => {
    it('should return null if no parent path', () => {
      expect(getParentPath('http://example.com')).toBeNull();
    });
    it('should return null if parent path is /', () => {
      expect(getParentPath('http://example.com/foo')).toBeNull();
    });
    it('should return the parent path', () => {
      expect(getParentPath('http://example.com/foo/bar')).toBe(
        'http://example.com/foo'
      );
    });
    it('should ignore a trailing slash', () => {
      expect(getParentPath('http://example.com/foo/bar/')).toBe(
        'http://example.com/foo'
      );
    });
    it('should keep query params', () => {
      expect(getParentPath('http://example.com/foo/bar?aa=bb')).toBe(
        'http://example.com/foo?aa=bb'
      );
      expect(getParentPath('http://example.com/foo/bar?')).toBe(
        'http://example.com/foo?'
      );
    });
  });
});
