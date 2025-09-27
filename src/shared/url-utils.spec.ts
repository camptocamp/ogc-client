import { getChildPath, getParentPath, getBaseUrl } from './url-utils.js';

describe('link utils', () => {
  describe('getBaseUrl', () => {
    it('should return the base url', () => {
      expect(getBaseUrl().toString()).toBe('http://localhost/');
      expect(getBaseUrl('http://example.com').toString()).toBe(
        'http://example.com/'
      );
    });
  });
  describe('getParentPath', () => {
    it('should return null if no parent path', () => {
      expect(getParentPath('http://example.com')).toBeNull();
    });
    it('should return null if parent path is /', () => {
      expect(getParentPath('http://example.com/foo')).toBeNull();
    });
    it('should return root path correctly if a trailing slash is present', () => {
      expect(getParentPath('http://example.com/foo/')).toBe(
        'http://example.com/'
      );
    });
    it('should return the parent path', () => {
      expect(getParentPath('http://example.com/foo/bar/baz')).toBe(
        'http://example.com/foo/bar'
      );
    });
    it('should return the parent path (including a trailing slash if on the app context part', () => {
      expect(getParentPath('http://example.com/foo/bar')).toBe(
        'http://example.com/foo/'
      );
    });
    it('should ignore a trailing slash', () => {
      expect(getParentPath('http://example.com/foo/bar/baz/')).toBe(
        'http://example.com/foo/bar'
      );
    });
    it('should keep query params', () => {
      expect(getParentPath('http://example.com/foo/bar?aa=bb')).toBe(
        'http://example.com/foo/?aa=bb'
      );
      expect(getParentPath('http://example.com/foo/bar?')).toBe(
        'http://example.com/foo/?'
      );
      expect(getParentPath('http://example.com/foo/bar/baz?aa=bb')).toBe(
        'http://example.com/foo/bar?aa=bb'
      );
      expect(getParentPath('http://example.com/foo/bar/baz?')).toBe(
        'http://example.com/foo/bar?'
      );
    });
  });
  describe('getChildPath', () => {
    it('should append a child fragment to the path', () => {
      expect(getChildPath('http://example.com/foo/', 'bar/')).toBe(
        'http://example.com/foo/bar/'
      );
    });
    it('should append a child fragment to the path with a slash in-between', () => {
      expect(getChildPath('http://example.com/foo', 'bar')).toBe(
        'http://example.com/foo/bar'
      );
    });
  });
});
