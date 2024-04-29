import {
  isMimeTypeGeoJson,
  isMimeTypeJson,
  isMimeTypeJsonFg,
} from './mime-type.js';

describe('mime type utils', () => {
  it('isMimeTypeJson', () => {
    expect(isMimeTypeJson('application/geo+json')).toBe(true);
    expect(isMimeTypeJson('application/vnd.geo+json')).toBe(true);
    expect(isMimeTypeJson('geo+json')).toBe(true);
    expect(isMimeTypeJson('geojson')).toBe(true);
    expect(isMimeTypeJson('application/json')).toBe(true);
    expect(isMimeTypeJson('json')).toBe(true);
  });
  it('isMimeTypeGeoJson', () => {
    expect(isMimeTypeGeoJson('application/geo+json')).toBe(true);
    expect(isMimeTypeGeoJson('application/vnd.geo+json')).toBe(true);
    expect(isMimeTypeGeoJson('geo+json')).toBe(true);
    expect(isMimeTypeGeoJson('geojson')).toBe(true);
    expect(isMimeTypeGeoJson('application/json')).toBe(false);
    expect(isMimeTypeGeoJson('json')).toBe(false);
  });
  it('isMimeTypeJsonFg', () => {
    expect(isMimeTypeJsonFg('application/vnd.ogc.fg+json')).toBe(true);
    expect(isMimeTypeJsonFg('fg+json')).toBe(true);
    expect(isMimeTypeJsonFg('jsonfg')).toBe(true);
    expect(isMimeTypeJsonFg('json-fg')).toBe(true);
    expect(isMimeTypeJsonFg('geo+json')).toBe(false);
    expect(isMimeTypeJsonFg('geojson')).toBe(false);
    expect(isMimeTypeJsonFg('application/json')).toBe(false);
    expect(isMimeTypeJsonFg('json')).toBe(false);
  });
});
