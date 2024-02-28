import { hasInvertedCoordinates, simplifyEpsgUrn } from './crs-utils.js';

describe('CRS utils', () => {
  describe('hasInvertedCoordinates', () => {
    it('returns true for EPSG:4326', () => {
      expect(hasInvertedCoordinates('EPSG:4326')).toBeTruthy();
    });
    it('returns false for EPSG:2154', () => {
      expect(hasInvertedCoordinates('EPSG:2154')).toBeFalsy();
    });
  });

  describe('simplifyEpsgUrn', () => {
    describe('given a full URN for a EPSG code', () => {
      it('returns the simplified EPSG code', () => {
        const urn = 'urn:ogc:def:crs:EPSG:6.3:2984';
        expect(simplifyEpsgUrn(urn)).toEqual('EPSG:2984');
      });
    });
    describe('given a full URN for a EPSG code (marked experimental)', () => {
      it('returns the simplified EPSG code', () => {
        const urn = 'urn:x-ogc:def:crs:EPSG:2154';
        expect(simplifyEpsgUrn(urn)).toEqual('EPSG:2154');
      });
    });
    describe('given a full URN for a non-EPSG code', () => {
      it('returns the URN untouched', () => {
        const urn = 'urn:ogc:def:crs:OGC:1.3:CRS84';
        expect(simplifyEpsgUrn(urn)).toEqual(urn);
      });
    });
  });
});
