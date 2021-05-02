import capabilities130 from '../../fixtures/wms/capabilities-brgm-1-3-0.xml';
import WmsEndpoint from './endpoint';

describe('WmsEndpoint', () => {
  /** @type {WmsEndpoint} */
  let endpoint;

  /** @type {'ok'|'httpError'|'corsError'} */
  let fetchBehaviour;

  beforeEach(() => {
    fetchBehaviour = 'ok';
    window.fetch = jest.fn(() => {
      switch (fetchBehaviour) {
        case 'ok':
          return Promise.resolve({
            text: () => Promise.resolve(capabilities130),
            status: 200,
            ok: true,
          });
        case 'httpError':
          return Promise.resolve({
            text: () => Promise.resolve('<error>Random error</error>'),
            status: 401,
            ok: false,
          });
        case 'corsError':
          return Promise.reject(new Error('Cross origin headers missing'));
        default:
          return Promise.reject();
      }
    });

    endpoint = new WmsEndpoint(
      'https://my.test.service/ogc/wms?service=wms&request=GetMap&aa=bb'
    );
  });

  it('makes a getcapabilities request', () => {
    expect(window.fetch).toHaveBeenCalledWith(
      'https://my.test.service/ogc/wms?aa=bb&SERVICE=WMS&REQUEST=GetCapabilities'
    );
  });

  describe('#isReady', () => {
    let enpoint2;
    describe('HTTP request returns success', () => {
      beforeEach(() => {
        enpoint2 = new WmsEndpoint('http://aa.bb');
      });
      it('resolves with the endpoint object', async () => {
        await expect(enpoint2.isReady()).resolves.toEqual(enpoint2);
      });
    });
    describe('HTTP request returns error', () => {
      beforeEach(() => {
        fetchBehaviour = 'httpError';
        enpoint2 = new WmsEndpoint('http://aa.bb');
      });
      it('rejects with an error', async () => {
        await expect(enpoint2.isReady()).rejects.toThrowError(
          'Received an error with code 401: <error>Random error</error>'
        );
      });
    });
    describe('HTTP fails for CORS reasons', () => {
      beforeEach(() => {
        fetchBehaviour = 'corsError';
        enpoint2 = new WmsEndpoint('http://aa.bb');
      });
      it('rejects with an error', async () => {
        await expect(enpoint2.isReady()).rejects.toThrowError(
          'Cross origin headers missing'
        );
      });
    });
  });

  describe('#getVersion', () => {
    it('returns the correct version', async () => {
      await endpoint.isReady();
      expect(endpoint.getVersion()).toBe('1.3.0');
    });
  });

  describe('#getLayers', () => {
    it('returns a summary of layers', async () => {
      await endpoint.isReady();
      expect(endpoint.getLayers()).toEqual([
        {
          abstract:
            "Ensemble des services d'accès aux données sur la géologie, l'hydrogéologie et la gravimétrie, diffusées par le BRGM",
          name: 'GEOSERVICES_GEOLOGIE',
          path: [],
          title: 'GéoServices : géologie, hydrogéologie et gravimétrie',
        },
        {
          abstract: 'Cartes géologiques',
          name: 'GEOLOGIE',
          path: ['GEOSERVICES_GEOLOGIE'],
          title: 'Cartes géologiques',
        },
        {
          abstract:
            'BD Scan-Million-Géol est la base de données géoréférencées de la carte géologique image à 1/1 000 000',
          name: 'SCAN_F_GEOL1M',
          path: ['GEOSERVICES_GEOLOGIE', 'GEOLOGIE'],
          title: 'Carte géologique image de la France au million',
        },
        {
          abstract:
            'BD Scan-Géol-250 est la base de données géoréférencées des cartes géologiques image à 1/250 000. Utilisation scientifique, technique, pédagogique',
          name: 'SCAN_F_GEOL250',
          path: ['GEOSERVICES_GEOLOGIE', 'GEOLOGIE'],
          title: 'Carte géologique image de la France au 1/250000',
        },
        {
          abstract:
            "BD Scan-Géol-50 est la base de données géoréférencées des cartes géologiques 'papier' à 1/50 000",
          name: 'SCAN_D_GEOL50',
          path: ['GEOSERVICES_GEOLOGIE', 'GEOLOGIE'],
          title: 'Carte géologique image de la France au 1/50 000e',
        },
      ]);
    });
  });

  describe('#getLayerByName', () => {
    it('returns detailed info on a layer', async () => {
      await endpoint.isReady();
      expect(endpoint.getLayerByName('GEOLOGIE')).toEqual({
        abstract: 'Cartes géologiques',
        attribution: {
          logoUrl: 'http://mapsref.brgm.fr/legendes/brgm_logo.png',
          title: 'Brgm',
          url: 'http://www.brgm.fr/',
        },
        availableCrs: [
          'EPSG:4326',
          'CRS:84',
          'EPSG:3857',
          'EPSG:4171',
          'EPSG:2154',
        ],
        boundingBoxes: {},
        name: 'GEOLOGIE',
        path: ['GEOSERVICES_GEOLOGIE'],
        styles: [
          {
            name: 'default',
            title: 'default',
          },
        ],
        title: 'Cartes géologiques',
      });
    });
  });

  describe('#getServiceInfo', () => {
    it('returns service info', async () => {
      await endpoint.isReady();
      expect(endpoint.getServiceInfo()).toEqual({
        abstract:
          "Ensemble des services d'accès aux données sur la géologie, l'hydrogéologie et la gravimétrie, diffusées par le BRGM",
        constraints: 'None',
        fees: 'no conditions apply',
        name: 'WMS',
        title: 'GéoServices : géologie, hydrogéologie et gravimétrie',
      });
    });
  });
});
