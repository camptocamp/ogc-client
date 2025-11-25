/**
 * Tests for main index exports
 * Verifies that all CSAPI resources are properly exported from the public API
 */

import * as mainExports from './index.js';

describe('Main Index Exports', () => {
  describe('CSAPI Client Classes', () => {
    it('should export SystemsClient', () => {
      expect(mainExports.SystemsClient).toBeDefined();
      expect(typeof mainExports.SystemsClient).toBe('function');
    });

    it('should export DeploymentsClient', () => {
      expect(mainExports.DeploymentsClient).toBeDefined();
      expect(typeof mainExports.DeploymentsClient).toBe('function');
    });

    it('should export ProceduresClient', () => {
      expect(mainExports.ProceduresClient).toBeDefined();
      expect(typeof mainExports.ProceduresClient).toBe('function');
    });

    it('should export SamplingFeaturesClient', () => {
      expect(mainExports.SamplingFeaturesClient).toBeDefined();
      expect(typeof mainExports.SamplingFeaturesClient).toBe('function');
    });

    it('should export PropertiesClient', () => {
      expect(mainExports.PropertiesClient).toBeDefined();
      expect(typeof mainExports.PropertiesClient).toBe('function');
    });

    it('should export DatastreamsClient', () => {
      expect(mainExports.DatastreamsClient).toBeDefined();
      expect(typeof mainExports.DatastreamsClient).toBe('function');
    });

    it('should export ObservationsClient', () => {
      expect(mainExports.ObservationsClient).toBeDefined();
      expect(typeof mainExports.ObservationsClient).toBe('function');
    });

    it('should export ControlStreamsClient', () => {
      expect(mainExports.ControlStreamsClient).toBeDefined();
      expect(typeof mainExports.ControlStreamsClient).toBe('function');
    });

    it('should export CommandsClient', () => {
      expect(mainExports.CommandsClient).toBeDefined();
      expect(typeof mainExports.CommandsClient).toBe('function');
    });

    it('should export FeasibilityClient', () => {
      expect(mainExports.FeasibilityClient).toBeDefined();
      expect(typeof mainExports.FeasibilityClient).toBe('function');
    });

    it('should export SystemEventsClient', () => {
      expect(mainExports.SystemEventsClient).toBeDefined();
      expect(typeof mainExports.SystemEventsClient).toBe('function');
    });
  });

  describe('CSAPI Aggregated Clients', () => {
    it('should export CSAPIClients object', () => {
      expect(mainExports.CSAPIClients).toBeDefined();
      expect(typeof mainExports.CSAPIClients).toBe('object');
    });

    it('CSAPIClients should contain all client classes', () => {
      expect(mainExports.CSAPIClients.SystemsClient).toBe(
        mainExports.SystemsClient
      );
      expect(mainExports.CSAPIClients.DeploymentsClient).toBe(
        mainExports.DeploymentsClient
      );
      expect(mainExports.CSAPIClients.DatastreamsClient).toBe(
        mainExports.DatastreamsClient
      );
    });
  });

  describe('CSAPI Helper Functions', () => {
    it('should export extractParameters helper', () => {
      expect(mainExports.extractParameters).toBeDefined();
      expect(typeof mainExports.extractParameters).toBe('function');
    });

    it('should export maybeFetchOrLoad helper', () => {
      expect(mainExports.maybeFetchOrLoad).toBeDefined();
      expect(typeof mainExports.maybeFetchOrLoad).toBe('function');
    });
  });

  describe('CSAPI Instantiation', () => {
    it('should be able to instantiate SystemsClient from main export', () => {
      const apiRoot = 'https://test.api/csapi';
      const client = new mainExports.SystemsClient(apiRoot);
      expect(client).toBeInstanceOf(mainExports.SystemsClient);
      expect(client.apiRoot).toBe(apiRoot);
    });

    it('should be able to instantiate DatastreamsClient from main export', () => {
      const apiRoot = 'https://test.api/csapi';
      const client = new mainExports.DatastreamsClient(apiRoot);
      expect(client).toBeInstanceOf(mainExports.DatastreamsClient);
      expect(client.apiRoot).toBe(apiRoot);
    });
  });

  describe('Backward Compatibility', () => {
    it('should still export existing WFS endpoint', () => {
      expect(mainExports.WfsEndpoint).toBeDefined();
    });

    it('should still export existing WMS endpoint', () => {
      expect(mainExports.WmsEndpoint).toBeDefined();
    });

    it('should still export existing OgcApiEndpoint', () => {
      expect(mainExports.OgcApiEndpoint).toBeDefined();
    });
  });
});
