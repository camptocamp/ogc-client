import {
  isMimeTypeGeoJson,
  isMimeTypeJson,
  isMimeTypeJsonFg,
  isMimeTypeSmlJson,
  isMimeTypeSweJson,
  isMimeTypeSweText,
  isMimeTypeSweCsv,
  isMimeTypeSweBinary,
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

  describe('isMimeTypeSmlJson', () => {
    it('matches canonical media type', () => {
      expect(isMimeTypeSmlJson('application/sml+json')).toBe(true);
    });
    it('matches shorthand', () => {
      expect(isMimeTypeSmlJson('sml+json')).toBe(true);
    });
    it('matches case-insensitively', () => {
      expect(isMimeTypeSmlJson('APPLICATION/SML+JSON')).toBe(true);
      expect(isMimeTypeSmlJson('Application/Sml+Json')).toBe(true);
    });
    it('rejects unrelated JSON types', () => {
      expect(isMimeTypeSmlJson('application/json')).toBe(false);
      expect(isMimeTypeSmlJson('application/geo+json')).toBe(false);
    });
    it('rejects SWE JSON', () => {
      expect(isMimeTypeSmlJson('application/swe+json')).toBe(false);
    });
  });

  describe('isMimeTypeSweJson', () => {
    it('matches canonical media type', () => {
      expect(isMimeTypeSweJson('application/swe+json')).toBe(true);
    });
    it('matches shorthand', () => {
      expect(isMimeTypeSweJson('swe+json')).toBe(true);
    });
    it('matches case-insensitively', () => {
      expect(isMimeTypeSweJson('APPLICATION/SWE+JSON')).toBe(true);
    });
    it('rejects unrelated JSON types', () => {
      expect(isMimeTypeSweJson('application/json')).toBe(false);
      expect(isMimeTypeSweJson('application/geo+json')).toBe(false);
    });
    it('rejects SML JSON', () => {
      expect(isMimeTypeSweJson('application/sml+json')).toBe(false);
    });
    it('rejects other SWE types', () => {
      expect(isMimeTypeSweJson('application/swe+text')).toBe(false);
      expect(isMimeTypeSweJson('application/swe+csv')).toBe(false);
      expect(isMimeTypeSweJson('application/swe+binary')).toBe(false);
    });
  });

  describe('isMimeTypeSweText', () => {
    it('matches canonical media type', () => {
      expect(isMimeTypeSweText('application/swe+text')).toBe(true);
    });
    it('matches shorthand', () => {
      expect(isMimeTypeSweText('swe+text')).toBe(true);
    });
    it('matches case-insensitively', () => {
      expect(isMimeTypeSweText('APPLICATION/SWE+TEXT')).toBe(true);
    });
    it('rejects SWE CSV', () => {
      expect(isMimeTypeSweText('application/swe+csv')).toBe(false);
    });
    it('rejects SWE JSON', () => {
      expect(isMimeTypeSweText('application/swe+json')).toBe(false);
    });
    it('rejects plain text', () => {
      expect(isMimeTypeSweText('text/plain')).toBe(false);
    });
  });

  describe('isMimeTypeSweCsv', () => {
    it('matches canonical media type', () => {
      expect(isMimeTypeSweCsv('application/swe+csv')).toBe(true);
    });
    it('matches shorthand', () => {
      expect(isMimeTypeSweCsv('swe+csv')).toBe(true);
    });
    it('matches case-insensitively', () => {
      expect(isMimeTypeSweCsv('APPLICATION/SWE+CSV')).toBe(true);
    });
    it('rejects SWE Text', () => {
      expect(isMimeTypeSweCsv('application/swe+text')).toBe(false);
    });
    it('rejects plain CSV', () => {
      expect(isMimeTypeSweCsv('text/csv')).toBe(false);
    });
    it('rejects SWE JSON', () => {
      expect(isMimeTypeSweCsv('application/swe+json')).toBe(false);
    });
  });

  describe('isMimeTypeSweBinary', () => {
    it('matches canonical media type', () => {
      expect(isMimeTypeSweBinary('application/swe+binary')).toBe(true);
    });
    it('matches shorthand', () => {
      expect(isMimeTypeSweBinary('swe+binary')).toBe(true);
    });
    it('matches case-insensitively', () => {
      expect(isMimeTypeSweBinary('APPLICATION/SWE+BINARY')).toBe(true);
    });
    it('rejects other SWE types', () => {
      expect(isMimeTypeSweBinary('application/swe+json')).toBe(false);
      expect(isMimeTypeSweBinary('application/swe+text')).toBe(false);
      expect(isMimeTypeSweBinary('application/swe+csv')).toBe(false);
    });
    it('rejects application/octet-stream', () => {
      expect(isMimeTypeSweBinary('application/octet-stream')).toBe(false);
    });
  });
});
