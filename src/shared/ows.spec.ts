// @ts-expect-error ts-migrate(7016)
import capabilitiesWfs110 from '../../fixtures/wfs/capabilities-pigma-1-1-0.xml';
// @ts-expect-error ts-migrate(7016)
import capabilitiesWfs200 from '../../fixtures/wfs/capabilities-pigma-2-0-0.xml';
// @ts-expect-error ts-migrate(7016)
import capabilitiesWmts from '../../fixtures/wmts/ogcsample.xml';
import { parseXmlString } from './xml-utils.js';
import { readProviderFromCapabilities } from './ows.js';

const wfsProvider = {
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
};

describe('OWS utils', () => {
  it('can read provider information from WFS capabilities (2.0.0)', () => {
    const doc = parseXmlString(capabilitiesWfs200);
    expect(readProviderFromCapabilities(doc)).toEqual(wfsProvider);
  });
  it('can read provider information from WFS capabilities (1.1.0)', () => {
    const doc = parseXmlString(capabilitiesWfs110);
    expect(readProviderFromCapabilities(doc)).toEqual(wfsProvider);
  });
  it('can read provider information from WMTS capabilities', () => {
    const expectedProvider = {
      name: 'MiraMon',
      site: 'http://www.creaf.uab.cat/miramon',
      contact: {
        name: 'Joan Maso Pau',
        position: 'Senior Software Engineer',
        phone: '+34 93 581 1312',
        fax: '+34 93 581 4151',
        address: {
          deliveryPoint: 'Fac Ciencies UAB',
          city: 'Bellaterra',
          administrativeArea: 'Barcelona',
          postalCode: '08193',
          country: 'Spain',
        },
        email: 'joan.maso@uab.cat',
      },
    };
    const doc = parseXmlString(capabilitiesWmts);
    expect(readProviderFromCapabilities(doc)).toEqual(expectedProvider);
  });
});
