import capabilities130 from '../../fixtures/wms/capabilities-brgm-1-3-0.xml';
import WmsEndpoint from './endpoint';

describe('WmsEndpoint', () => {
  /** @type {WmsEndpoint} */
  let endpoint;

  beforeEach(() => {
    window.fetch = jest.fn(() => {
      return Promise.resolve({ text: () => Promise.resolve(capabilities130) });
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

  describe('#getVersion', () => {
    it('returns the correct version', (done) => {
      endpoint.getVersion().then((version) => {
        expect(version).toBe('1.3.0');
        done();
      });
    });
  });

  describe('#getLayers', () => {
    it('returns a summary of layers', (done) => {
      endpoint.getLayers().then((layers) => {
        expect(layers).toEqual([
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
        done();
      });
    });
  });

  describe('#getLayerByName', () => {
    it('returns detailed info on a layer', (done) => {
      endpoint.getLayerByName('GEOLOGIE').then((layer) => {
        expect(layer).toEqual({
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
        done();
      });
    });
  });

  describe('#getServiceInfo', () => {
    it('returns service info', (done) => {
      endpoint.getServiceInfo().then((info) => {
        expect(info).toEqual({
          abstract:
            "Ensemble des services d'accès aux données sur la géologie, l'hydrogéologie et la gravimétrie, diffusées par le BRGM",
          constraints: 'None',
          fees: 'no conditions apply',
          name: 'WMS',
          title: 'GéoServices : géologie, hydrogéologie et gravimétrie',
        });
        done();
      });
    });
  });
});
