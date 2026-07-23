import {
  getBaseUrl,
  getChildPath,
  getParentPath,
  setQueryParams,
} from './url-utils.js';

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
  describe('setQueryParams', () => {
    it('adds new parameters if not present', () => {
      expect(
        setQueryParams('https://my.host/service?arg1=123', {
          ARG2: '45',
          Arg3: 'hello',
        })
      ).toBe('https://my.host/service?arg1=123&ARG2=45&Arg3=hello');
    });
    it('replaces existing parameters regardless of case', () => {
      expect(
        setQueryParams('https://my.host/service?ARG1=123&Arg2=bla&arg3', {
          ARG2: '45',
          Arg3: 'hello',
        })
      ).toBe('https://my.host/service?ARG1=123&ARG2=45&Arg3=hello');
    });
    it('removes parameters set to null', () => {
      expect(
        setQueryParams('https://my.host/service?ARG1=123&Arg2=bla&arg3', {
          arg1: null,
          ARG2: null,
          Arg3: 'hello',
        })
      ).toBe('https://my.host/service?Arg3=hello');
    });
    it('sets a parameter without value if true', () => {
      expect(
        setQueryParams('https://my.host/service', {
          ARG2: true,
        })
      ).toBe('https://my.host/service?ARG2=');
    });
    it('appends an encoded URL if found (HTTP)', () => {
      expect(
        setQueryParams('http://bad.proxy/?url=http%3A%2F%2Fmy.host%2Fservice', {
          ARG2: '45',
          Arg3: 'hello',
        })
      ).toBe(
        'http://bad.proxy/?url=http%3A%2F%2Fmy.host%2Fservice%3FARG2%3D45%26Arg3%3Dhello'
      );
    });
    it('appends an encoded URL if found (HTTPS)', () => {
      expect(
        setQueryParams(
          'http://bad.proxy/?url=https%3A%2F%2Fmy.host%2Fservice',
          {
            ARG2: '45',
            Arg3: 'hello',
          }
        )
      ).toBe(
        'http://bad.proxy/?url=https%3A%2F%2Fmy.host%2Fservice%3FARG2%3D45%26Arg3%3Dhello'
      );
    });
    it('makes sure that spaces are encoded as %20', () => {
      expect(
        setQueryParams(
          'https://my.host/service?arg1=old+value&something=else+entirely',
          {
            ARG1: 'new value',
            'ARG 2': 'value with space',
          }
        )
      ).toBe(
        'https://my.host/service?something=else%20entirely&ARG1=new%20value&ARG%202=value%20with%20space'
      );
    });
  });
});
