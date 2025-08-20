import { zParameterToString, ZParameter } from './model.js';

describe('zParameterToString', () => {
  test('single level', () => {
    const z: ZParameter = { type: 'single', level: 850 };
    expect(zParameterToString(z)).toBe('850');
  });

  test('interval (min/max)', () => {
    const z: ZParameter = { type: 'interval', minLevel: 100, maxLevel: 550 };
    expect(zParameterToString(z)).toBe('100/550');
  });

  test('list of levels', () => {
    const z: ZParameter = { type: 'list', levels: [10, 80, 200] };
    expect(zParameterToString(z)).toBe('10,80,200');
  });

  test('repeating interval', () => {
    const z: ZParameter = {
      type: 'repeating',
      repeat: 20,
      minLevel: 100,
      step: 50,
    };
    expect(zParameterToString(z)).toBe('R20/100/50');
  });

  test('list with single element should still stringify correctly', () => {
    const z: ZParameter = { type: 'list', levels: [42] };
    expect(zParameterToString(z)).toBe('42');
  });

  test('interval minLevel greater than maxLevel still produces string', () => {
    const z: ZParameter = { type: 'interval', minLevel: 500, maxLevel: 100 };
    expect(zParameterToString(z)).toBe('500/100');
  });
});
