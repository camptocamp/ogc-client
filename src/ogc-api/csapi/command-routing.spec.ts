/**
 * Tests for CSAPI command fallback routing.
 *
 * Verifies that the command routing module correctly:
 * - Detects 400 "Invalid resource name" route rejections
 * - Caches per-server routing preferences
 * - Constructs nested command URLs through parent control streams
 *
 * @see https://github.com/OS4CSAPI/ogc-client-CSAPI_2/issues/47
 */

import type { OgcApiCollectionInfo } from '../model.js';
import CSAPIQueryBuilder from './url_builder.js';
import {
  isCommandRouteRejection,
  getCommandRoutingPreference,
  setCommandRoutingPreference,
  clearCommandRoutingCache,
  buildNestedCommandUrl,
} from './command-routing.js';

// ========================================
// Test Fixtures
// ========================================

/**
 * Builds a minimal OgcApiCollectionInfo with both controlStreams and
 * commands advertised, matching the url_builder.spec.ts pattern.
 */
function makeCollection(
  overrides: Partial<OgcApiCollectionInfo> = {}
): OgcApiCollectionInfo {
  return {
    links: [],
    title: 'Test Collection',
    description: 'A test collection',
    id: 'test-collection',
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

/** Builder with both controlStreams and commands available. */
function makeBuilder(): CSAPIQueryBuilder {
  return new CSAPIQueryBuilder(
    makeCollection({
      links: [
        {
          rel: 'self',
          type: '',
          title: '',
          href: 'https://example.com/collections/iot',
        },
        {
          rel: 'ogc-cs:controlStreams',
          type: '',
          title: '',
          href: '/controlStreams',
        },
        { rel: 'ogc-cs:commands', type: '', title: '', href: '/commands' },
      ],
    })
  );
}

// ========================================
// Route Rejection Detection
// ========================================

describe('isCommandRouteRejection', () => {
  it('returns true for 400 with "Invalid resource name" in body', () => {
    expect(
      isCommandRouteRejection(400, "Invalid resource name: 'commands'")
    ).toBe(true);
  });

  it('returns true when pattern appears anywhere in body text', () => {
    expect(
      isCommandRouteRejection(
        400,
        '{"error":"Bad Request","message":"Invalid resource name: \'commands\'"}'
      )
    ).toBe(true);
  });

  it('returns false for non-400 status codes', () => {
    expect(isCommandRouteRejection(200, 'Invalid resource name')).toBe(false);
    expect(isCommandRouteRejection(404, 'Invalid resource name')).toBe(false);
    expect(isCommandRouteRejection(500, 'Invalid resource name')).toBe(false);
  });

  it('returns false when body does not contain the rejection pattern', () => {
    expect(isCommandRouteRejection(400, 'Some other error')).toBe(false);
    expect(isCommandRouteRejection(400, 'Not found')).toBe(false);
  });

  it('returns false when body text is undefined', () => {
    expect(isCommandRouteRejection(400)).toBe(false);
    expect(isCommandRouteRejection(400, undefined)).toBe(false);
  });
});

// ========================================
// Routing Preference Cache
// ========================================

describe('command routing cache', () => {
  beforeEach(clearCommandRoutingCache);

  it('returns undefined for an uncached server', () => {
    expect(
      getCommandRoutingPreference('https://osh.example.com')
    ).toBeUndefined();
  });

  it('stores and retrieves "nested-only" preference', () => {
    setCommandRoutingPreference('https://osh.example.com', 'nested-only');
    expect(getCommandRoutingPreference('https://osh.example.com')).toBe(
      'nested-only'
    );
  });

  it('stores and retrieves "top-level" preference', () => {
    setCommandRoutingPreference('https://spec-server.example.com', 'top-level');
    expect(getCommandRoutingPreference('https://spec-server.example.com')).toBe(
      'top-level'
    );
  });

  it('isolates cache entries per server base URL', () => {
    setCommandRoutingPreference('https://a.example.com', 'nested-only');
    setCommandRoutingPreference('https://b.example.com', 'top-level');
    expect(getCommandRoutingPreference('https://a.example.com')).toBe(
      'nested-only'
    );
    expect(getCommandRoutingPreference('https://b.example.com')).toBe(
      'top-level'
    );
  });

  it('clears all entries when clearCommandRoutingCache is called', () => {
    setCommandRoutingPreference('https://a.example.com', 'nested-only');
    setCommandRoutingPreference('https://b.example.com', 'top-level');
    clearCommandRoutingCache();
    expect(
      getCommandRoutingPreference('https://a.example.com')
    ).toBeUndefined();
    expect(
      getCommandRoutingPreference('https://b.example.com')
    ).toBeUndefined();
  });
});

// ========================================
// Nested URL Construction
// ========================================

describe('buildNestedCommandUrl', () => {
  const builder = makeBuilder();

  it('builds a nested commands list URL (getCommands fallback)', () => {
    const url = buildNestedCommandUrl(builder, 'cs-001');
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/commands'
    );
  });

  it('builds a nested single command URL (getCommand fallback)', () => {
    const url = buildNestedCommandUrl(builder, 'cs-001', 'cmd-001');
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/commands/cmd-001'
    );
  });

  it('builds a nested command status URL (getCommandStatus fallback)', () => {
    const url = buildNestedCommandUrl(builder, 'cs-001', 'cmd-001', 'status');
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/commands/cmd-001/status'
    );
  });

  it('builds a nested command result URL (getCommandResult fallback)', () => {
    const url = buildNestedCommandUrl(builder, 'cs-001', 'cmd-001', 'result');
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/commands/cmd-001/result'
    );
  });

  it('builds a nested command cancel URL (cancelCommand fallback)', () => {
    const url = buildNestedCommandUrl(builder, 'cs-001', 'cmd-001', 'cancel');
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/commands/cmd-001/cancel'
    );
  });

  it('passes query options through to the nested URL', () => {
    const url = buildNestedCommandUrl(builder, 'cs-001', undefined, undefined, {
      issueTime: { start: new Date('2024-01-01T00:00:00Z') },
      limit: 50,
    });
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/commands?issueTime=2024-01-01T00%3A00%3A00.000Z%2F..&limit=50'
    );
  });

  it('encodes special characters in command IDs', () => {
    const url = buildNestedCommandUrl(builder, 'cs-001', 'cmd/special id');
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/commands/cmd%2Fspecial%20id'
    );
  });

  it('combines command ID, sub-path, and query options', () => {
    const url = buildNestedCommandUrl(builder, 'cs-001', 'cmd-001', 'status', {
      limit: 10,
    });
    expect(url).toContain('/controlstreams/cs-001/commands/cmd-001/status');
    expect(url).toContain('limit=10');
  });
});

// ========================================
// End-to-End Fallback Flow
// ========================================

describe('end-to-end fallback flow', () => {
  const serverUrl = 'https://osh.example.com';
  const builder = makeBuilder();

  beforeEach(clearCommandRoutingCache);

  it('skips fallback when top-level is cached as supported', () => {
    setCommandRoutingPreference(serverUrl, 'top-level');
    // Caller uses builder.getCommand('cmd-001') directly — no fallback
    const topLevelUrl = builder.getCommand('cmd-001');
    expect(topLevelUrl).toBe(
      'https://example.com/collections/iot/commands/cmd-001'
    );
    expect(getCommandRoutingPreference(serverUrl)).toBe('top-level');
  });

  it('detects rejection, caches preference, and builds nested URL', () => {
    // Step 1: No cached preference — caller tries top-level first
    expect(getCommandRoutingPreference(serverUrl)).toBeUndefined();

    // Step 2: Server returns 400 for top-level /commands/cmd-001
    const rejected = isCommandRouteRejection(
      400,
      "Invalid resource name: 'commands'"
    );
    expect(rejected).toBe(true);

    // Step 3: Cache the server's routing preference
    setCommandRoutingPreference(serverUrl, 'nested-only');

    // Step 4: Build the nested fallback URL
    const nestedUrl = buildNestedCommandUrl(builder, 'cs-001', 'cmd-001');
    expect(nestedUrl).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/commands/cmd-001'
    );

    // Step 5: Subsequent calls skip top-level attempt
    expect(getCommandRoutingPreference(serverUrl)).toBe('nested-only');
  });

  it('uses nested URL directly when server is cached as nested-only', () => {
    setCommandRoutingPreference(serverUrl, 'nested-only');

    // Caller goes straight to nested URL — no top-level attempt
    const url = buildNestedCommandUrl(builder, 'cs-001', 'cmd-001', 'status');
    expect(url).toBe(
      'https://example.com/collections/iot/controlstreams/cs-001/commands/cmd-001/status'
    );
  });
});
