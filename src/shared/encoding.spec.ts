import { queryXmlDocument } from './http-utils.js';
import { readInfoFromCapabilities } from '../wms/capabilities.js';
import { join } from 'path';
import { readFileSync } from 'fs';

const global = window as any;

describe('parse XML documents with alternate encodings', () => {
  let responseCharset;

  beforeAll(() => {
    global.fetch = jest.fn((fileUrl) => {
      const pathFromRoot = new URL(fileUrl).pathname;
      const filePath = join(__dirname, '../..', pathFromRoot);
      const buffer = readFileSync(filePath);
      const headers = responseCharset
        ? {
            'Content-Type': `application/xml; charset=${responseCharset}`,
          }
        : {
            'Content-Type': 'application/xml',
          };
      return Promise.resolve({
        arrayBuffer: () => Promise.resolve(buffer),
        status: 200,
        ok: true,
        headers: new Headers(headers),
        clone: function () {
          return this;
        },
      });
    });
  });
  afterAll(() => {
    global.fetch = global.mockFetch;
  });
  beforeEach(() => {
    responseCharset = null;
  });
  describe('UTF-8 (without header)', () => {
    it('successfully parses the XML file', async () => {
      const doc = await queryXmlDocument(
        'http://localhost:8888/fixtures/wms/capabilities-brgm-1-1-1.xml'
      );
      expect(readInfoFromCapabilities(doc).title).toBe(
        'GéoServices : géologie, hydrogéologie et gravimétrie'
      );
    });
  });
  describe('UTF-8 (with header)', () => {
    beforeEach(() => {
      responseCharset = 'UTF-8';
    });
    it('successfully parses the XML file', async () => {
      const doc = await queryXmlDocument(
        'http://localhost:8888/fixtures/wms/capabilities-brgm-1-1-1.xml'
      );
      expect(readInfoFromCapabilities(doc).title).toBe(
        'GéoServices : géologie, hydrogéologie et gravimétrie'
      );
    });
  });
  describe('UTF-16 (without header)', () => {
    it('successfully parses the XML file', async () => {
      const doc = await queryXmlDocument(
        'http://localhost:8888/fixtures/wms/capabilities-brgm-1-1-1-utf-16.xml'
      );
      expect(readInfoFromCapabilities(doc).title).toBe(
        'GéoServices : géologie, hydrogéologie et gravimétrie'
      );
    });
  });
  describe('UTF-16 (with header)', () => {
    beforeEach(() => {
      responseCharset = 'UTF-16';
    });
    it('successfully parses the XML file', async () => {
      const doc = await queryXmlDocument(
        'http://localhost:8888/fixtures/wms/capabilities-brgm-1-1-1-utf-16.xml'
      );
      expect(readInfoFromCapabilities(doc).title).toBe(
        'GéoServices : géologie, hydrogéologie et gravimétrie'
      );
    });
  });
  describe('ISO-8859-15 (without header)', () => {
    it('parses the XML file in ISO-8859-1 but misses ISO-8859-15 specific chars', async () => {
      const doc = await queryXmlDocument(
        'http://localhost:8888/fixtures/wms/capabilities-brgm-1-1-1-iso-8859-15.xml'
      );
      expect(readInfoFromCapabilities(doc).title).toBe(
        'GéoServices : géologie, hydrogéologie et gravimétrie ¤'
      );
    });
  });
  describe('ISO-8859-15 (with header)', () => {
    beforeEach(() => {
      responseCharset = 'ISO-8859-15';
    });
    it('successfully parses the XML file', async () => {
      const doc = await queryXmlDocument(
        'http://localhost:8888/fixtures/wms/capabilities-brgm-1-1-1-iso-8859-15.xml'
      );
      expect(readInfoFromCapabilities(doc).title).toBe(
        'GéoServices : géologie, hydrogéologie et gravimétrie €'
      );
    });
  });
});
