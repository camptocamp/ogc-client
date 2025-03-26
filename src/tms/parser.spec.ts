import {
  parseTileMapServiceXML,
  parseTileMapXML,
  extractEndpointInfo,
  extractTileMapReferences,
} from './parser.js';
import { TileMapService } from './model.js';
import { parseXmlString } from '../shared/xml-utils.js';

describe('TMS parser utilities', () => {
  describe('parseTileMapServiceXML', () => {
    let xmlString: string;

    beforeEach(() => {
      xmlString = `
      <TileMapService version="1.0.0" services="http://tms.osgeo.org">
        <Title>Example Tile Map Service</Title>
        <Abstract>This is a longer description of the example tiling map service.</Abstract>
        <KeywordList>example tile service</KeywordList>
        <ContactInformation>
          <ContactPersonPrimary>
            <ContactPerson>Paul Ramsey</ContactPerson>
            <ContactOrganization>Refractions Research</ContactOrganization>
          </ContactPersonPrimary>
          <ContactPosition>Manager</ContactPosition>
          <ContactAddress>
            <AddressType>postal</AddressType>
            <Address>300 - 1207 Douglas Street</Address>
            <City>Victoria</City>
            <StateOrProvince>British Columbia</StateOrProvince>
            <PostCode>V8W2E7</PostCode>
            <Country>Canada</Country>
          </ContactAddress>
          <ContactVoiceTelephone>12503833022</ContactVoiceTelephone>
          <ContactFacsimileTelephone>12503832140</ContactFacsimileTelephone>
          <ContactElectronicMailAddress>pramsey@refractions.net</ContactElectronicMailAddress>
        </ContactInformation>
        <TileMaps>
          <TileMap 
            title="VMAP0 World Map" 
            srs="EPSG:4326" 
            profile="global-geodetic" 
            href="http://tms.osgeo.org/1.0.0/vmap0" />
          <TileMap 
            title="British Columbia Landsat Imagery (2000)" 
            srs="EPSG:3005" 
            profile="local" 
            href="http://tms.osgeo.org/1.0.0/landsat2000" />
        </TileMaps>
      </TileMapService>
    `;
    });


    it('parses the TileMapService XML correctly', () => {
      const xmlDoc = parseXmlString(xmlString);
      const result = parseTileMapServiceXML(xmlDoc);

      expect(result.version).toBe('1.0.0');
      expect(result.title).toBe('Example Tile Map Service');
      expect(result.abstract).toBe(
        'This is a longer description of the example tiling map service.'
      );
      expect(result.keywords).toEqual(['example tile service']);
      expect(result.tileMaps?.length).toBe(2);
      expect(result.tileMaps?.[0]).toEqual({
        title: 'VMAP0 World Map',
        srs: 'EPSG:4326',
        profile: 'global-geodetic',
        href: 'http://tms.osgeo.org/1.0.0/vmap0',
      });
    });

    it('handles empty TileMapService XML', () => {
      const emptyXml = '<TileMapService version="1.0.0"></TileMapService>';
      const emptyXmlDoc = parseXmlString(emptyXml);
      const result = parseTileMapServiceXML(emptyXmlDoc);

      expect(result.version).toBe('1.0.0');
      expect(result.title).toBe('');
      expect(result.abstract).toBe('');
      expect(result.keywords).toEqual([]);
      expect(result.tileMaps).toEqual([]);
    });
  });

  describe('parseTileMapXML', () => {
    let xmlString: string;

    beforeEach(() => {
      xmlString = `<?xml version="1.0" encoding="UTF-8" ?>  
  <TileMap version="1.0.0" tilemapservice="http://tms.osgeo.org/1.0.0">
   <Title>VMAP0 World Map</Title>
   <Abstract>A map of the world built from the NGA VMAP0 vector data set.</Abstract>
   <KeywordList>VMAP0,world map</KeywordList>
   <Metadata type="TC211" mime-type="text/xml" href="http://www.org" />
   <Attribution>
     <Title>National Geospatial Intelligence Agency</Title>
     <Logo width="10" height="10" href="http://nga.mil/logo.gif" mime-type="image/gif" />
   </Attribution>
   <WebMapContext href="http://wms.org" /> 
   <Face>0</Face>
   <SRS>EPSG:4326</SRS>
   <BoundingBox minx="-180" miny="-90" maxx="180" maxy="90" />
   <Origin x="-180" y="-90" />  
   <TileFormat width="256" height="256" mime-type="image/jpeg" extension="jpg" />
   <TileSets profile="global-geodetic">
     <TileSet href="http://tms.osgeo.org/1.0.0/vmap0/0" units-per-pixel="0.703125" order="0" />
     <TileSet href="http://tms.osgeo.org/1.0.0/vmap0/1" units-per-pixel="0.3515625" order="1" />
     <TileSet href="http://tms.osgeo.org/1.0.0/vmap0/2" units-per-pixel="0.17578125" order="2" />
     <TileSet href="http://tms.osgeo.org/1.0.0/vmap0/3" units-per-pixel="0.08789063" order="3" />
   </TileSets>
  </TileMap>`;
    });


    it('parses the TileMap XML correctly', () => {
      const xmlDoc = parseXmlString(xmlString);
      const result = parseTileMapXML(xmlDoc);

      expect(result.version).toBe('1.0.0');
      expect(result.tileMapService).toBe('http://tms.osgeo.org/1.0.0');
      expect(result.title).toBe('VMAP0 World Map');
      expect(result.abstract).toBe(
        'A map of the world built from the NGA VMAP0 vector data set.'
      );
      expect(result.srs).toBe('EPSG:4326');
      expect(result.boundingBox).toEqual([-180, -90, 180, 90]);
      expect(result.origin).toEqual({ x: -180, y: -90 });
      expect(result.tileFormat).toEqual({
        width: 256,
        height: 256,
        mimeType: 'image/jpeg',
        extension: 'jpg',
      });
      expect(result.tileSets.profile).toBe('global-geodetic');
      expect(result.tileSets.tileSets.length).toBe(4);
      expect(result.tileSets.tileSets[0]).toEqual({
        href: 'http://tms.osgeo.org/1.0.0/vmap0/0',
        unitsPerPixel: 0.703125,
        order: 0,
      });
      expect(result.metadata?.length).toBe(1);
      expect(result.attribution?.title).toBe(
        'National Geospatial Intelligence Agency'
      );
      expect(result.attribution?.logo).toEqual({
        width: 10,
        height: 10,
        href: 'http://nga.mil/logo.gif',
        mimeType: 'image/gif',
      });
      expect(result.keywords).toEqual(['VMAP0,world map']);
      expect(result.webMapContext).toBe('http://wms.org');
    });

    it('handles minimal TileMap XML', () => {
      const minimalXml = `
        <TileMap version="1.0.0" tilemapservice="http://example.com/tms">
          <Title>Minimal Map</Title>
          <SRS>EPSG:4326</SRS>
          <BoundingBox minx="-180" miny="-90" maxx="180" maxy="90" />
          <Origin x="-180" y="-90" />
          <TileFormat width="256" height="256" mime-type="image/png" extension="png" />
          <TileSets profile="global-geodetic">
            <TileSet href="http://example.com/0" units-per-pixel="0.703125" order="0" />
          </TileSets>
        </TileMap>
      `;
      const xmlDoc = parseXmlString(minimalXml);

      const result = parseTileMapXML(xmlDoc);

      expect(result.title).toBe('Minimal Map');
      expect(result.abstract).toBe('');
      expect(result.srs).toBe('EPSG:4326');
      expect(result.metadata).toBeUndefined();
      expect(result.attribution).toBeUndefined();
      expect(result.keywords).toBeUndefined();
      expect(result.webMapContext).toBeUndefined();
    });
  });

  describe('extractEndpointInfo', () => {
    let serviceData: TileMapService;

    beforeEach(() => {
      serviceData = {
        version: '1.0.0',
        title: 'Test TMS Service',
        abstract: 'A test TMS service',
        keywords: ['test', 'tms', 'service'],
        tileMaps: [
          {
            title: 'Test Map',
            srs: 'EPSG:4326',
            profile: 'global-geodetic',
            href: 'http://example.com/map1',
          },
        ],
      };
    });

    it('extracts endpoint info correctly', () => {
      const result = extractEndpointInfo(serviceData);

      expect(result).toEqual({
        title: 'Test TMS Service',
        abstract: 'A test TMS service',
        keywords: ['test', 'tms', 'service'],
      });
    });

    it('handles minimal service data', () => {
      const minimalData = {
        version: '1.0.0',
        title: 'Minimal Service',
      };

      const result = extractEndpointInfo(minimalData);

      expect(result).toEqual({
        title: 'Minimal Service',
        abstract: undefined,
        keywords: undefined,
      });
    });
  });

  describe('extractTileMapReferences', () => {
    let serviceData: TileMapService;

    beforeEach(() => {
      serviceData = {
        version: '1.0.0',
        title: 'Test TMS Service',
        tileMaps: [
          {
            title: 'Map 1',
            srs: 'EPSG:4326',
            profile: 'global-geodetic',
            href: 'http://example.com/map1',
          },
          {
            title: 'Map 2',
            srs: 'EPSG:3857',
            profile: 'global-mercator',
            href: 'http://example.com/map2',
          },
        ],
      };
    });

    it('extracts tile map references correctly', () => {
      const result = extractTileMapReferences(serviceData);

      expect(result).toEqual([
        {
          title: 'Map 1',
          srs: 'EPSG:4326',
          profile: 'global-geodetic',
          href: 'http://example.com/map1',
        },
        {
          title: 'Map 2',
          srs: 'EPSG:3857',
          profile: 'global-mercator',
          href: 'http://example.com/map2',
        },
      ]);
    });

    it('returns empty array when no tile maps exist', () => {
      const noTileMaps = {
        version: '1.0.0',
        title: 'No Maps Service',
      };

      const result = extractTileMapReferences(noTileMaps);

      expect(result).toEqual([]);
    });
  });
});
