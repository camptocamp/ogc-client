import capabilities130 from '../../fixtures/wms/capabilities-brgm-1-3-0.xml';
import WmsEndpoint from './endpoint';

describe('WmsEndpoint', () => {
  /** @type {WmsEndpoint} */
  let endpoint;

  beforeEach(() => {
    window.fetchResponseFactory = () => capabilities130;
    endpoint = new WmsEndpoint(
      'https://my.test.service/ogc/wms?service=wms&request=GetMap&aa=bb'
    );
  });

  it('makes a getcapabilities request', async () => {
    await endpoint.isReady();
    expect(window.fetch).toHaveBeenCalledWith(
      'https://my.test.service/ogc/wms?aa=bb&SERVICE=WMS&REQUEST=GetCapabilities'
    );
  });

  describe('#isReady', () => {
    it('resolves with the endpoint object', async () => {
      await expect(endpoint.isReady()).resolves.toEqual(endpoint);
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
          children: [
            {
              abstract: 'Cartes géologiques',
              children: [
                {
                  abstract:
                    'BD Scan-Million-Géol est la base de données géoréférencées de la carte géologique image à 1/1 000 000',
                  name: 'SCAN_F_GEOL1M',
                  title: 'Carte géologique image de la France au million',
                },
                {
                  abstract:
                    'BD Scan-Géol-250 est la base de données géoréférencées des cartes géologiques image à 1/250 000. Utilisation scientifique, technique, pédagogique',
                  name: 'SCAN_F_GEOL250',
                  title: 'Carte géologique image de la France au 1/250000',
                },
                {
                  abstract:
                    "BD Scan-Géol-50 est la base de données géoréférencées des cartes géologiques 'papier' à 1/50 000",
                  name: 'SCAN_D_GEOL50',
                  title: 'Carte géologique image de la France au 1/50 000e',
                },
              ],
              name: 'GEOLOGIE',
              title: 'Cartes géologiques',
            },
          ],
          name: 'GEOSERVICES_GEOLOGIE',
          title: 'GéoServices : géologie, hydrogéologie et gravimétrie',
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
        styles: [
          {
            name: 'default',
            title: 'default',
          },
        ],
        title: 'Cartes géologiques',
        children: expect.any(Array),
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
