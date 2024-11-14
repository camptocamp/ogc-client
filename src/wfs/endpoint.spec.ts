// @ts-expect-error ts-migrate(7016)
import capabilities200 from '../../fixtures/wfs/capabilities-pigma-2-0-0.xml';
// @ts-expect-error ts-migrate(7016)
import getfeature200hits from '../../fixtures/wfs/getfeature-hits-pigma-2-0-0.xml';
// @ts-expect-error ts-migrate(7016)
import getfeature200full from '../../fixtures/wfs/getfeature-props-pigma-2-0-0.xml';
// @ts-expect-error ts-migrate(7016)
import describefeaturetype200 from '../../fixtures/wfs/describefeaturetype-pigma-2-0-0-xsd.xml';
// @ts-expect-error ts-migrate(7016)
import capabilitiesStates from '../../fixtures/wfs/capabilities-states-2-0-0.xml';
// @ts-expect-error ts-migrate(7016)
import exceptionReportWms from '../../fixtures/wfs/exception-report-wms.xml';
import WfsEndpoint from './endpoint.js';
import { useCache } from '../shared/cache.js';
import { EndpointError, ServiceExceptionError } from '../shared/errors.js';

jest.mock('../shared/cache', () => ({
  useCache: jest.fn((factory) => factory()),
}));

const global = window as any;

describe('WfsEndpoint', () => {
  let endpoint: WfsEndpoint;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn');
  });

  beforeEach(() => {
    global.fetchPreHandler = () => {};
    global.fetchResponseFactory = (url) => {
      if (url.indexOf('GetCapabilities') > -1) return capabilities200;
      if (url.indexOf('GetFeature') > -1) {
        if (url.indexOf('RESULTTYPE=hits') > -1) return getfeature200hits;
        else return getfeature200full;
      }
      if (url.indexOf('DescribeFeatureType') > -1)
        return describefeaturetype200;
      return 'error';
    };
    endpoint = new WfsEndpoint(
      'https://my.test.service/ogc/wfs?service=wfs&request=DescribeFeatureType'
    );
  });

  it('makes a getcapabilities request', async () => {
    await endpoint.isReady();
    expect(global.fetch).toHaveBeenCalledWith(
      'https://my.test.service/ogc/wfs?SERVICE=WFS&REQUEST=GetCapabilities',
      { method: 'GET' }
    );
  });

  describe('caching', () => {
    beforeEach(async () => {
      await endpoint.isReady();
    });
    it('uses cache once', () => {
      expect(useCache).toHaveBeenCalledTimes(1);
    });
    it('stores the parsed capabilities in cache', async () => {
      await expect(
        (useCache as any).mock.results[0].value
      ).resolves.toMatchObject({
        info: {
          title: "Service WFS de l'IDS régionale PIGMA",
        },
      });
    });
  });

  describe('#isReady', () => {
    it('resolves with the endpoint object', async () => {
      await expect(endpoint.isReady()).resolves.toEqual(endpoint);
    });

    describe('CORS error handling', () => {
      beforeEach(() => {
        global.fetchPreHandler = (url, options) => {
          if (options?.method === 'HEAD') return 'ok!';
          throw new Error('CORS problem');
        };
        endpoint = new WfsEndpoint('https://my.test.service/ogc/wfs');
      });
      it('rejects with a relevant error', async () => {
        const error = (await endpoint
          .isReady()
          .catch((e) => e)) as EndpointError;
        expect(error).toBeInstanceOf(EndpointError);
        expect(error.message).toBe(
          'The document could not be fetched due to CORS limitations'
        );
        expect(error.httpStatus).toBe(0);
        expect(error.isCrossOriginRelated).toBe(true);
      });
    });

    describe('endpoint error handling', () => {
      beforeEach(() => {
        global.fetchPreHandler = () => {
          throw new TypeError('other kind of problem');
        };
        endpoint = new WfsEndpoint('https://my.test.service/ogc/wfs');
      });
      it('rejects with a relevant error', async () => {
        const error = (await endpoint
          .isReady()
          .catch((e) => e)) as EndpointError;
        expect(error).toBeInstanceOf(EndpointError);
        expect(error.message).toBe(
          'Fetching the document failed either due to network errors or unreachable host, error is: other kind of problem'
        );
        expect(error.httpStatus).toBe(0);
        expect(error.isCrossOriginRelated).toBe(false);
      });
    });

    describe('http error handling', () => {
      beforeEach(() => {
        global.fetchPreHandler = () => ({
          ok: false,
          text: () => Promise.resolve('something broke in the server'),
          status: 500,
          statusText: 'Internal Server Error',
        });
        endpoint = new WfsEndpoint('https://my.test.service/ogc/wfs');
      });
      it('rejects with a relevant error', async () => {
        const error = (await endpoint
          .isReady()
          .catch((e) => e)) as EndpointError;
        expect(error).toBeInstanceOf(EndpointError);
        expect(error.message).toBe(
          'Received an error with code 500: something broke in the server'
        );
        expect(error.httpStatus).toBe(500);
        expect(error.isCrossOriginRelated).toBe(false);
      });
    });

    describe('service exception handling', () => {
      beforeEach(() => {
        global.fetchResponseFactory = () => exceptionReportWms;
        endpoint = new WfsEndpoint('https://my.test.service/ogc/wfs');
      });
      it('rejects when the endpoint returns an exception report', async () => {
        const error = (await endpoint
          .isReady()
          .catch((e) => e)) as ServiceExceptionError;
        expect(error).toBeInstanceOf(ServiceExceptionError);
        expect(error.message).toBe(
          'msWFSDispatch(): WFS server error. WFS request not enabled. Check wfs/ows_enable_request settings.'
        );
        expect(error.requestUrl).toBe(
          'https://my.test.service/ogc/wfs?SERVICE=WFS&REQUEST=GetCapabilities'
        );
        expect(error.code).toBe('InvalidParameterValue');
        expect(error.locator).toBe('request');
      });
    });
  });

  describe('#getVersion', () => {
    it('returns the correct version', async () => {
      await endpoint.isReady();
      expect(endpoint.getVersion()).toBe('2.0.0');
    });
  });

  describe('#getFeatureTypes', () => {
    it('returns a list of feature types (summary)', async () => {
      await endpoint.isReady();
      expect(endpoint.getFeatureTypes()).toEqual([
        {
          abstract:
            'Registre Parcellaire Graphique 2010 en Aquitaine - Agence de Service et de Paiement',
          boundingBox: [
            -1.9540704007796161, 42.73286181824404, 1.496463327812538,
            45.717071228823876,
          ],
          name: 'asp:asp_rpg2010',
          title: 'ASP - RPG 2010',
        },
        {
          abstract:
            'Représentation des moyennes journalières des trafics routiers sur les routes départementales de la\n                Charente (16) au 1er Janvier 2021.\n\n                Mise à jour : Mars 2021\n            ',
          boundingBox: [
            -0.4906009184568518, 45.175543885638376, 0.9778719979726385,
            46.14349349624617,
          ],
          name: 'cd16:comptages_routiers_l',
          title: 'CD 16 - Comptages routiers',
        },
        {
          abstract:
            'Hiérarchisation du réseau routier départemental en fonction des caractéristiques de chaque section\n                de route et de son usage au 1er Janvier 2021.\n\n                Mise à jour : Mars 2021\n            ',
          boundingBox: [
            -0.4832134559131876, 45.18037755571674, 0.9725372441782966,
            46.13877580094452,
          ],
          name: 'cd16:hierarchisation_l',
          title: 'CD 16 - Hiérarchisation du réseau',
        },
      ]);
    });
  });

  describe('#getFeatureTypeSummary', () => {
    it('returns general info on a feature type', async () => {
      await endpoint.isReady();
      expect(endpoint.getFeatureTypeSummary('cd16:hierarchisation_l')).toEqual({
        abstract:
          'Hiérarchisation du réseau routier départemental en fonction des caractéristiques de chaque section\n                de route et de son usage au 1er Janvier 2021.\n\n                Mise à jour : Mars 2021\n            ',
        name: 'cd16:hierarchisation_l',
        title: 'CD 16 - Hiérarchisation du réseau',
        boundingBox: [
          -0.4832134559131876, 45.18037755571674, 0.9725372441782966,
          46.13877580094452,
        ],
        defaultCrs: 'EPSG:2154',
        keywords: ['features', 'hierarchisation_l'],
        metadata: [
          {
            url: 'https://www.pigma.org/geonetwork?uuid=cd27adaa-0ec5-4934-9374-143df09fb9f6',
          },
          {
            url: 'https://www.pigma.org/geonetwork?uuid=cd27adaa-0ec5-4934-9374-143df09fb9f6',
          },
          {
            url: 'https://www.pigma.org/geonetwork/srv/fre/xml_iso19139?uuid=cd27adaa-0ec5-4934-9374-143df09fb9f6',
          },
        ],
        otherCrs: ['EPSG:32615', 'EPSG:32616', 'EPSG:32617', 'EPSG:32618'],
        outputFormats: [
          'application/gml+xml; version=3.2',
          'text/xml; subtype=gml/3.2.1',
          'text/xml; subtype=gml/3.1.1',
          'text/xml; subtype=gml/2.1.2',
        ],
      });
    });
    it('finds a feature type without namespace', async () => {
      await endpoint.isReady();
      expect(endpoint.getFeatureTypeSummary('hierarchisation_l')).toMatchObject(
        {
          name: 'cd16:hierarchisation_l',
        }
      );
    });
  });

  describe('#getFeatureTypeFull', () => {
    it('uses cache', async () => {
      await endpoint.isReady();
      endpoint.getFeatureTypeFull('cd16:hierarchisation_l');
      expect(useCache).toHaveBeenCalledTimes(2);
    });
    it('returns detailed info on a feature type', async () => {
      await endpoint.isReady();
      await expect(
        endpoint.getFeatureTypeFull('cd16:hierarchisation_l')
      ).resolves.toEqual({
        abstract:
          'Hiérarchisation du réseau routier départemental en fonction des caractéristiques de chaque section\n                de route et de son usage au 1er Janvier 2021.\n\n                Mise à jour : Mars 2021\n            ',
        name: 'cd16:hierarchisation_l',
        title: 'CD 16 - Hiérarchisation du réseau',
        boundingBox: [
          -0.4832134559131876, 45.18037755571674, 0.9725372441782966,
          46.13877580094452,
        ],
        defaultCrs: 'EPSG:2154',
        keywords: ['features', 'hierarchisation_l'],
        metadata: [
          {
            url: 'https://www.pigma.org/geonetwork?uuid=cd27adaa-0ec5-4934-9374-143df09fb9f6',
          },
          {
            url: 'https://www.pigma.org/geonetwork?uuid=cd27adaa-0ec5-4934-9374-143df09fb9f6',
          },
          {
            url: 'https://www.pigma.org/geonetwork/srv/fre/xml_iso19139?uuid=cd27adaa-0ec5-4934-9374-143df09fb9f6',
          },
        ],
        otherCrs: ['EPSG:32615', 'EPSG:32616', 'EPSG:32617', 'EPSG:32618'],
        outputFormats: [
          'application/gml+xml; version=3.2',
          'text/xml; subtype=gml/3.2.1',
          'text/xml; subtype=gml/3.1.1',
          'text/xml; subtype=gml/2.1.2',
        ],
        properties: {
          axe: 'string',
          cumuld: 'integer',
          cumulf: 'integer',
          plod: 'string',
          absd: 'integer',
          plof: 'string',
          absf: 'integer',
          categorie: 'integer',
        },
        geometryName: 'geom',
        geometryType: 'linestring',
        objectCount: 364237,
      });
    });
  });

  describe('#getSingleFeatureTypeName', () => {
    it('returns null (multiple feature types)', async () => {
      await endpoint.isReady();
      expect(endpoint.getSingleFeatureTypeName()).toBe(null);
    });

    describe('with a single feature type', () => {
      beforeEach(() => {
        global.fetchResponseFactory = () => capabilitiesStates;
        endpoint = new WfsEndpoint(
          'https://my.test.service/ogc/wfs?service=wfs&request=DescribeFeatureType'
        );
      });
      it('returns the single feature type name', async () => {
        await endpoint.isReady();
        expect(endpoint.getSingleFeatureTypeName()).toBe('usa:states');
      });
    });
  });

  describe('#getServiceInfo', () => {
    it('returns service info', async () => {
      await endpoint.isReady();
      expect(endpoint.getServiceInfo()).toEqual({
        abstract: "Service WFS de l'IDS régionale PIGMA",
        constraints: 'aucun',
        fees: 'aucun',
        name: 'WFS',
        title: "Service WFS de l'IDS régionale PIGMA",
        keywords: ['WFS', 'WMS', 'GEOSERVER'],
        provider: {
          name: 'GIP ATGeRi',
          site: '',
          contact: {
            name: 'PIGMA',
            position: '',
            phone: '05.57.85.40.42',
            fax: '',
            address: {
              deliveryPoint: '',
              city: 'Bordeaux',
              administrativeArea: '',
              postalCode: '33075',
              country: '',
            },
            email: 'admin.pigma@gipatgeri.fr',
          },
        },
        outputFormats: [
          'application/gml+xml; version=3.2',
          'DXF',
          'DXF-ZIP',
          'GML2',
          'KML',
          'SHAPE-ZIP',
          'application/json',
          'application/vnd.google-earth.kml xml',
          'application/vnd.google-earth.kml+xml',
          'csv',
          'excel',
          'excel2007',
          'gml3',
          'gml32',
          'json',
          'text/javascript',
          'text/xml; subtype=gml/2.1.2',
          'text/xml; subtype=gml/3.1.1',
          'text/xml; subtype=gml/3.2',
        ],
      });
    });
  });

  describe('#getFeatureTypePropDetails', () => {
    it('uses cache', async () => {
      await endpoint.isReady();
      await endpoint.getFeatureTypePropDetails('cd16:hierarchisation_l');
      expect(useCache).toHaveBeenCalledTimes(3);
    });
    it('returns detailed info on a feature type', async () => {
      await endpoint.isReady();
      await expect(
        endpoint.getFeatureTypePropDetails('cd16:hierarchisation_l')
      ).resolves.toEqual({
        absd: {
          uniqueValues: [
            {
              count: 2,
              value: 904,
            },
            {
              count: 1,
              value: 99,
            },
            {
              count: 1,
              value: 470,
            },
            {
              count: 5,
              value: 812,
            },
            {
              count: 1,
              value: 0,
            },
          ],
        },
        absf: {
          uniqueValues: [
            {
              count: 2,
              value: 99,
            },
            {
              count: 1,
              value: 470,
            },
            {
              count: 1,
              value: 620,
            },
            {
              count: 5,
              value: 646,
            },
            {
              count: 1,
              value: 121,
            },
          ],
        },
        axe: {
          uniqueValues: [
            {
              count: 9,
              value: 'D941',
            },
            {
              count: 1,
              value: 'D910_GIR_3',
            },
          ],
        },
        categorie: {
          uniqueValues: [
            {
              count: 9,
              value: 2,
            },
            {
              count: 1,
              value: 3,
            },
          ],
        },
        cumuld: {
          uniqueValues: [
            {
              count: 2,
              value: 19363,
            },
            {
              count: 1,
              value: 23565,
            },
            {
              count: 1,
              value: 24897,
            },
            {
              count: 5,
              value: 31232,
            },
            {
              count: 1,
              value: 0,
            },
          ],
        },
        cumulf: {
          uniqueValues: [
            {
              count: 2,
              value: 23565,
            },
            {
              count: 1,
              value: 24897,
            },
            {
              count: 1,
              value: 28060,
            },
            {
              count: 5,
              value: 37029,
            },
            {
              count: 1,
              value: 121,
            },
          ],
        },
        plod: {
          uniqueValues: [
            {
              count: 2,
              value: '38',
            },
            {
              count: 1,
              value: '43',
            },
            {
              count: 1,
              value: '44',
            },
            {
              count: 5,
              value: '50',
            },
            {
              count: 1,
              value: '0',
            },
          ],
        },
        plof: {
          uniqueValues: [
            {
              count: 2,
              value: '43',
            },
            {
              count: 1,
              value: '44',
            },
            {
              count: 1,
              value: '47',
            },
            {
              count: 5,
              value: '56',
            },
            {
              count: 1,
              value: '0',
            },
          ],
        },
      });
    });
  });

  describe('#getFeatureUrl', () => {
    beforeEach(async () => {
      await endpoint.isReady();
    });
    it('returns a GetFeature url for a given feature type', () => {
      expect(
        endpoint.getFeatureUrl('hierarchisation_l', {
          maxFeatures: 200,
          outputFormat: 'application/gml+xml; version=3.2',
        })
      ).toEqual(
        'https://www.pigma.org/geoserver/wfs?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=cd16%3Ahierarchisation_l&OUTPUTFORMAT=application%2Fgml%2Bxml%3B+version%3D3.2&COUNT=200'
      );
    });
    it('returns a GetFeature requesting geojson url for a given feature type', () => {
      expect(
        endpoint.getFeatureUrl('comptages_routiers_l', {
          asJson: true,
        })
      ).toEqual(
        'https://www.pigma.org/geoserver/wfs?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=cd16%3Acomptages_routiers_l&OUTPUTFORMAT=application%2Fjson'
      );
    });
    it('returns a GetFeature with a bbox and output crs for a given feature type', () => {
      expect(
        endpoint.getFeatureUrl('hierarchisation_l', {
          extent: [1, 2, 3, 4],
          outputCrs: 'EPSG:2154',
        })
      ).toEqual(
        'https://www.pigma.org/geoserver/wfs?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=cd16%3Ahierarchisation_l&SRSNAME=EPSG%3A2154&BBOX=1%2C2%2C3%2C4'
      );
    });
    it('throws an error if the feature type was not found', () => {
      expect(() => endpoint.getFeatureUrl('does_not_exist', {})).toThrow(
        'feature type'
      );
    });
    it('logs a warning if the required output format is not supported by the feature type', () => {
      endpoint.getFeatureUrl('hierarchisation_l', {
        maxFeatures: 200,
        outputFormat: 'application/invalid+mime+type',
      });
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('output format')
      );
    });
    it('throws an error if the the feature type does not support geojson', () => {
      expect(() =>
        endpoint.getFeatureUrl('hierarchisation_l', {
          asJson: true,
        })
      ).toThrow('GeoJSON');
    });
    it('returns a GetFeature url with the desired attributes', () => {
      expect(
        endpoint.getFeatureUrl('hierarchisation_l', {
          attributes: ['field1', 'field2'],
        })
      ).toEqual(
        'https://www.pigma.org/geoserver/wfs?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=cd16%3Ahierarchisation_l&PROPERTYNAME=field1%2Cfield2'
      );
    });
    it('returns a GetFeature url with only the hit count', () => {
      expect(
        endpoint.getFeatureUrl('hierarchisation_l', {
          hitsOnly: true,
        })
      ).toEqual(
        'https://www.pigma.org/geoserver/wfs?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=cd16%3Ahierarchisation_l&RESULTTYPE=hits&COUNT=1'
      );
    });
  });

  describe('#supportsJson', () => {
    beforeEach(async () => {
      await endpoint.isReady();
    });
    it('returns true if the feature type has at least one format containing json', () => {
      expect(endpoint.supportsJson('cd16:comptages_routiers_l')).toBeTruthy();
    });
    it('returns false otherwise', () => {
      expect(endpoint.supportsJson('cd16:hierarchisation_l')).toBeFalsy();
    });
    it('throws if the feature type is not found', () => {
      expect(() => endpoint.supportsJson('not:valid')).toThrow(
        'feature type was not found'
      );
    });
  });

  describe('#supportsStartIndex', () => {
    it('returns true if the WFS version is 2.0.0 or higher', async () => {
      await endpoint.isReady();
      expect(endpoint.supportsStartIndex()).toBeTruthy();
    });
  });

  describe('#getCapabilitiesUrl', () => {
    it.skip('returns the URL used for the request before the capabilities are retrieved', async () => {
      expect(endpoint.getCapabilitiesUrl()).toBe(
        'https://my.test.service/ogc/wms?aa=bb&SERVICE=WMS&REQUEST=GetCapabilities'
      );
      await endpoint.isReady();
    });

    it('returns the self-reported URL after the capabilities are retrieved', async () => {
      await endpoint.isReady();
      expect(endpoint.getCapabilitiesUrl()).toBe(
        'https://www.pigma.org/geoserver/wfs?SERVICE=WMS&REQUEST=GetCapabilities'
      );
    });
  });

  describe('#getOperationUrl', () => {
    it.skip('returns NULL before the document is loaded', async () => {
      expect(endpoint.getOperationUrl('GetMap')).toBeNull();
      await endpoint.isReady();
    });

    it('returns undefined for a non-existant operation', async () => {
      await endpoint.isReady();
      expect(endpoint.getOperationUrl('foo')).toBeUndefined();
    });

    it('returns the correct URL for an existant operation', async () => {
      await endpoint.isReady();
      expect(endpoint.getOperationUrl('GetFeature')).toBe(
        'https://www.pigma.org/geoserver/wfs'
      );
    });
  });
});
