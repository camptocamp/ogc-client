/**
 * Integration tests — Command workflow.
 *
 * Verifies the command/control lifecycle:
 * discover systems → find control streams → build feasibility URL →
 * submit command → track status → retrieve result → cancel command.
 *
 * Also tests the command fallback routing module for servers that reject
 * top-level `/commands` (Issue #47 / Finding F34).
 *
 * All HTTP interactions use `globalThis.fetch = jest.fn()` mocking (AP2).
 *
 * @see https://github.com/OS4CSAPI/ogc-client-CSAPI_2/issues/31
 * @see https://docs.ogc.org/is/23-002/23-002.html
 */

import type { OgcApiCollectionInfo } from '../../model.js';
import CSAPIQueryBuilder from '../url_builder.js';
import { EndpointError } from '../../../shared/errors.js';
import { parseCollectionResponse } from '../formats/response.js';
import {
  isCommandRouteRejection,
  getCommandRoutingPreference,
  setCommandRoutingPreference,
  clearCommandRoutingCache,
  buildNestedCommandUrl,
} from '../command-routing.js';

// ========================================
// Test Fixtures
// ========================================

function makeCollection(
  overrides: Partial<OgcApiCollectionInfo> = {}
): OgcApiCollectionInfo {
  return {
    links: [
      { rel: 'self', type: '', title: '', href: 'https://api.example.com/collections/actuators' },
      { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
      { rel: 'ogc-cs:controlStreams', type: '', title: '', href: '/controlStreams' },
      { rel: 'ogc-cs:commands', type: '', title: '', href: '/commands' },
    ],
    title: 'Actuator Network',
    description: 'Systems with command capability',
    id: 'actuators',
    itemFormats: [],
    bulkDownloadLinks: {},
    jsonDownloadLink: '',
    crs: [],
    itemCount: 0,
    queryables: [],
    sortables: [],
    mapTileFormats: [],
    vectorTileFormats: [],
    supportedTileMatrixSets: [],
    ...overrides,
  };
}

/** Control stream list response (items envelope). */
const CONTROL_STREAMS_RESPONSE = {
  items: [
    {
      id: 'cs-valve',
      name: 'Valve Controller',
      controlledProperties: ['http://example.com/props/valve-position'],
      issueTime: null,
      executionTime: null,
      live: true,
      async: true,
      formats: ['application/swe+json'],
      links: [
        { rel: 'self', href: '/controlstreams/cs-valve' },
      ],
    },
    {
      id: 'cs-pump',
      name: 'Pump Controller',
      controlledProperties: ['http://example.com/props/pump-speed'],
      issueTime: null,
      executionTime: null,
      live: true,
      async: false,
      formats: ['application/swe+json'],
      links: [],
    },
  ],
  links: [],
};

/** Async command submission response — 201 Created with pending status. */
const COMMAND_CREATED_ASYNC = {
  items: [
    {
      id: 'cmd-001',
      issueTime: '2024-06-15T14:00:00Z',
      currentStatus: 'PENDING',
      parameters: { position: 45.0 },
      links: [
        { rel: 'self', href: '/commands/cmd-001' },
        { rel: 'status', href: '/commands/cmd-001/status' },
      ],
    },
  ],
  links: [],
};

/** Sync command response — 200 OK with completed status and inline result. */
const COMMAND_SYNC_RESULT = {
  items: [
    {
      id: 'cmd-sync',
      issueTime: '2024-06-15T14:05:00Z',
      currentStatus: 'COMPLETED',
      parameters: { speed: 100 },
      links: [],
    },
  ],
  links: [],
};

/** Command status response — executing with progress. */
const COMMAND_STATUS_EXECUTING = {
  items: [
    {
      id: 'status-001',
      reportTime: '2024-06-15T14:00:05Z',
      statusCode: 'EXECUTING',
      percentCompletion: 50,
      message: 'Valve moving to target position',
    },
  ],
  links: [],
};

/** Command status response — completed. */
const COMMAND_STATUS_COMPLETED = {
  items: [
    {
      id: 'status-002',
      reportTime: '2024-06-15T14:00:10Z',
      statusCode: 'COMPLETED',
      percentCompletion: 100,
      message: 'Valve at target position',
    },
  ],
  links: [],
};

// ========================================
// Control Stream Discovery
// ========================================

describe('Command workflow — control stream discovery', () => {
  const builder = new CSAPIQueryBuilder(makeCollection());

  it('builds system control streams URL', () => {
    const url = builder.getSystemControlStreams('sys-001');
    expect(url).toBe(
      'https://api.example.com/collections/actuators/systems/sys-001/controlstreams'
    );
  });

  it('parses control stream items response', () => {
    const parsed = parseCollectionResponse(CONTROL_STREAMS_RESPONSE);
    expect(parsed.items).toHaveLength(2);

    const valve = parsed.items[0] as Record<string, unknown>;
    expect(valve.id).toBe('cs-valve');
    expect(valve.async).toBe(true);
    expect(valve.live).toBe(true);
  });
});

// ========================================
// Feasibility Check
// ========================================

describe('Command workflow — feasibility check', () => {
  const builder = new CSAPIQueryBuilder(makeCollection());

  it('builds feasibility check URL for a control stream', () => {
    const url = builder.checkCommandFeasibility('cs-valve');
    expect(url).toBe(
      'https://api.example.com/collections/actuators/controlstreams/cs-valve/feasibility'
    );
  });
});

// ========================================
// Command Submission
// ========================================

describe('Command workflow — command submission', () => {
  const builder = new CSAPIQueryBuilder(makeCollection());

  it('builds command creation URL using nested path', () => {
    const url = builder.createCommand('cs-valve');
    expect(url).toBe(
      'https://api.example.com/collections/actuators/controlstreams/cs-valve/commands'
    );
  });

  it('builds bulk command creation URL', () => {
    const url = builder.createCommands('cs-valve');
    expect(url).toBe(
      'https://api.example.com/collections/actuators/controlstreams/cs-valve/commands'
    );
  });

  it('parses async command submission response', () => {
    const parsed = parseCollectionResponse(COMMAND_CREATED_ASYNC);
    expect(parsed.items).toHaveLength(1);

    const cmd = parsed.items[0] as Record<string, unknown>;
    expect(cmd.id).toBe('cmd-001');
    expect(cmd.currentStatus).toBe('PENDING');
    expect(cmd.parameters).toEqual({ position: 45.0 });
  });

  it('parses sync command response with immediate completion', () => {
    const parsed = parseCollectionResponse(COMMAND_SYNC_RESULT);
    const cmd = parsed.items[0] as Record<string, unknown>;
    expect(cmd.currentStatus).toBe('COMPLETED');
  });
});

// ========================================
// Status Tracking
// ========================================

describe('Command workflow — status tracking', () => {
  const builder = new CSAPIQueryBuilder(makeCollection());

  it('builds command status URL', () => {
    const url = builder.getCommandStatus('cmd-001');
    expect(url).toBe(
      'https://api.example.com/collections/actuators/commands/cmd-001/status'
    );
  });

  it('parses executing status with progress', () => {
    const parsed = parseCollectionResponse(COMMAND_STATUS_EXECUTING);
    const status = parsed.items[0] as Record<string, unknown>;
    expect(status.statusCode).toBe('EXECUTING');
    expect(status.percentCompletion).toBe(50);
    expect(status.message).toContain('moving to target');
  });

  it('parses completed status', () => {
    const parsed = parseCollectionResponse(COMMAND_STATUS_COMPLETED);
    const status = parsed.items[0] as Record<string, unknown>;
    expect(status.statusCode).toBe('COMPLETED');
    expect(status.percentCompletion).toBe(100);
  });
});

// ========================================
// Result Retrieval
// ========================================

describe('Command workflow — result retrieval', () => {
  const builder = new CSAPIQueryBuilder(makeCollection());

  it('builds command result URL', () => {
    const url = builder.getCommandResult('cmd-001');
    expect(url).toBe(
      'https://api.example.com/collections/actuators/commands/cmd-001/result'
    );
  });
});

// ========================================
// Command Cancellation
// ========================================

describe('Command workflow — cancellation', () => {
  const builder = new CSAPIQueryBuilder(makeCollection());

  it('builds cancel URL', () => {
    const url = builder.cancelCommand('cmd-001');
    expect(url).toBe(
      'https://api.example.com/collections/actuators/commands/cmd-001/cancel'
    );
  });
});

// ========================================
// Fallback Routing — Top-Level Rejection
// ========================================

describe('Command workflow — fallback routing (F34)', () => {
  const serverUrl = 'https://osh.example.com';
  const builder = new CSAPIQueryBuilder(makeCollection());

  beforeEach(clearCommandRoutingCache);

  it('top-level URL → 400 rejection → nested fallback for getCommand', () => {
    // Step 1: Builder produces spec-compliant top-level URL
    const topLevelUrl = builder.getCommand('cmd-001');
    expect(topLevelUrl).toContain('/commands/cmd-001');

    // Step 2: Server rejects with 400
    const rejected = isCommandRouteRejection(
      400,
      "Invalid resource name: 'commands'"
    );
    expect(rejected).toBe(true);

    // Step 3: Cache server preference
    setCommandRoutingPreference(serverUrl, 'nested-only');

    // Step 4: Build nested fallback
    const nestedUrl = buildNestedCommandUrl(builder, 'cs-valve', 'cmd-001');
    expect(nestedUrl).toContain('/controlstreams/cs-valve/commands/cmd-001');
  });

  it('top-level URL → 400 rejection → nested fallback for getCommandStatus', () => {
    setCommandRoutingPreference(serverUrl, 'nested-only');

    const nestedUrl = buildNestedCommandUrl(
      builder,
      'cs-valve',
      'cmd-001',
      'status'
    );
    expect(nestedUrl).toContain(
      '/controlstreams/cs-valve/commands/cmd-001/status'
    );
  });

  it('top-level URL → 400 rejection → nested fallback for getCommands (list)', () => {
    setCommandRoutingPreference(serverUrl, 'nested-only');

    const nestedUrl = buildNestedCommandUrl(builder, 'cs-valve', undefined, undefined, {
      issueTime: { start: new Date('2024-01-01T00:00:00Z') },
      limit: 50,
    });
    expect(nestedUrl).toContain('/controlstreams/cs-valve/commands');
    expect(nestedUrl).toContain('issueTime=');
    expect(nestedUrl).toContain('limit=50');
  });

  it('skips fallback when server is cached as top-level', () => {
    setCommandRoutingPreference(serverUrl, 'top-level');
    expect(getCommandRoutingPreference(serverUrl)).toBe('top-level');

    // Caller uses top-level URL directly — no fallback needed
    const url = builder.getCommand('cmd-001');
    expect(url).toContain('/commands/cmd-001');
    expect(url).not.toContain('/controlstreams/');
  });

  it('caches preference per server base URL', () => {
    setCommandRoutingPreference('https://osh.server.com', 'nested-only');
    setCommandRoutingPreference('https://spec.server.com', 'top-level');

    expect(getCommandRoutingPreference('https://osh.server.com')).toBe(
      'nested-only'
    );
    expect(getCommandRoutingPreference('https://spec.server.com')).toBe(
      'top-level'
    );
  });
});

// ========================================
// Error Scenarios
// ========================================

describe('Command workflow — error scenarios', () => {
  it('throws EndpointError when commands not available', () => {
    const noCommands = makeCollection({
      links: [
        { rel: 'self', type: '', title: '', href: 'https://api.example.com/collections/ro' },
        { rel: 'ogc-cs:systems', type: '', title: '', href: '/systems' },
      ],
      id: 'ro',
    });
    const builder = new CSAPIQueryBuilder(noCommands);

    expect(() => builder.getCommands()).toThrow(EndpointError);
    expect(() => builder.getCommand('cmd-001')).toThrow(
      /does not support 'commands'/
    );
  });

  it('throws EndpointError when controlStreams not available', () => {
    const noCS = makeCollection({
      links: [
        { rel: 'self', type: '', title: '', href: 'https://api.example.com/collections/nocs' },
        { rel: 'ogc-cs:commands', type: '', title: '', href: '/commands' },
      ],
      id: 'nocs',
    });
    const builder = new CSAPIQueryBuilder(noCS);

    expect(() => builder.createCommand('cs-001')).toThrow(
      /does not support 'controlStreams'/
    );
    expect(() => builder.checkCommandFeasibility('cs-001')).toThrow(
      /does not support 'controlStreams'/
    );
  });

  it('handles rejected response that is not a route rejection', () => {
    // 400 but different error message — NOT a route rejection
    expect(
      isCommandRouteRejection(400, 'Missing required parameter')
    ).toBe(false);

    // 404 is not a route rejection
    expect(isCommandRouteRejection(404, "Invalid resource name: 'commands'")).toBe(false);
  });
});
