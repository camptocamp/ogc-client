// @ts-expect-error ts-migrate(7016)
import capabilities from '../../fixtures/wps/capabilities-geoserver.xml';
import { parseXmlString } from '../shared/xml-utils.js';
import {
  readInfoFromCapabilities,
  readOperationUrlsFromCapabilities,
  readProcessesFromCapabilities,
  readVersionFromCapabilities,
} from './capabilities.js';

describe('WPS capabilities', () => {
  const doc = parseXmlString(capabilities);

  describe('readVersionFromCapabilities', () => {
    it('reads the version', () => {
      expect(readVersionFromCapabilities(doc)).toBe('1.0.0');
    });
  });

  describe('readInfoFromCapabilities', () => {
    it('reads the service info', () => {
      expect(readInfoFromCapabilities(doc)).toMatchObject({
        title: 'Demo WPS',
        name: 'WPS',
        abstract: 'Web Processing Service for the demo GeoServer instance',
        fees: 'NONE',
        constraints: 'NONE',
        keywords: ['WPS', 'geospatial', 'geoprocessing'],
      });
    });

    it('reads the provider info', () => {
      expect(readInfoFromCapabilities(doc).provider).toMatchObject({
        name: 'Example Org',
        site: 'https://www.example.org',
        contact: {
          name: 'Jane Doe',
          position: 'GIS Manager',
        },
      });
    });
  });

  describe('readOperationUrlsFromCapabilities', () => {
    it('reads the operation urls including the distinct Execute POST url', () => {
      expect(readOperationUrlsFromCapabilities(doc)).toEqual({
        GetCapabilities: {
          Get: 'https://my.wps.server/geoserver/ows?',
          Post: 'https://my.wps.server/geoserver/ows?',
        },
        DescribeProcess: {
          Get: 'https://my.wps.server/geoserver/ows?',
          Post: 'https://my.wps.server/geoserver/ows?',
        },
        Execute: {
          Get: 'https://my.wps.server/geoserver/ows?',
          Post: 'https://my.wps.server/geoserver/wps',
        },
      });
    });
  });

  describe('readProcessesFromCapabilities', () => {
    it('lists the advertised processes', () => {
      expect(readProcessesFromCapabilities(doc)).toEqual([
        {
          identifier: 'JTS:buffer',
          title: 'Buffer a geometry',
          abstract: 'Returns the buffer of a geometry by a given distance',
          processVersion: '1.0.0',
        },
        {
          identifier: 'ras:Contour',
          title: 'Contour',
          abstract: 'Extracts contours from a raster',
          processVersion: '2.0.0',
        },
      ]);
    });
  });
});
