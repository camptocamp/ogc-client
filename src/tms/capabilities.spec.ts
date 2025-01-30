// @ts-expect-error ts-migrate(7016)
import capabilities from '../../fixtures/tms/capabilities-geopf.xml';
import { parseXmlString } from '../shared/xml-utils.js';
import { readLayersFromCapabilities } from './capabilities';

describe('TMS capabilities', () => {
    describe('readLayersFromCapabilities', () => {
        const expectedLayers = [
            {
              extension: 'jpeg',
              href: 'https://data.geopf.fr/tms/1.0.0/500k',
              title: '500k',
              profile: 'none',
              srs: 'EPSG:3857'
            },
            {
              extension: 'png',
              href: 'https://data.geopf.fr/tms/1.0.0/ACCES.BIOMETHANE',
              title: 'Cartographie biométhane d’accès aux réseaux',
              profile: 'none',
              srs: 'EPSG:3857'
            },
            {
              extension: 'png',
              href: 'https://data.geopf.fr/tms/1.0.0/ADMINEXPRESS-COG-CARTO.LATEST',
              title: 'ADMINEXPRESS COG CARTO',
              profile: 'none',
              srs: 'EPSG:3857'
            },
            {
              extension: 'png',
              href: 'https://data.geopf.fr/tms/1.0.0/ADMINEXPRESS-COG.LATEST',
              title: 'ADMINEXPRESS COG',
              profile: 'none',
              srs: 'EPSG:3857'
            },
            {
              extension: 'png',
              href: 'https://data.geopf.fr/tms/1.0.0/ADMINEXPRESS_COG_2020',
              title: 'ADMINEXPRESS_COG (2022)',
              profile: 'none',
              srs: 'EPSG:3857'
            }
          ];

        it('reads the layers', () => {
            const doc = parseXmlString(capabilities);
            expect(readLayersFromCapabilities(doc)).toEqual(expectedLayers);
        });
    });
});