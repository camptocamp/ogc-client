<!--
@license BSD-3-Clause
Copyright (c) 2024 OS4CSAPI contributors
-->

# CSAPI Unified Fixtures - Examples Suite

This directory contains a unified, comprehensive set of fixtures for testing OGC API – Connected Systems (CSAPI) Parts 1 and 2 implementations.

## Overview

These fixtures replace the previous separate `sample-data-hub` and `advanced` fixture directories, combining their strengths into a single, robust test suite with enhanced standards compliance.

## Key Features

### ✅ Standards-Compliant Geometry

- **Spatial Resources**: Systems, Deployments, and SamplingFeatures include valid GeoJSON geometry
  - Point geometries for individual sensors/stations
  - Polygon geometries for area-based systems
  - LineString geometries for transect-based sampling
- **Non-Spatial Resources**: Procedures and Properties correctly have `geometry: null` or omit geometry entirely, per CSAPI specification

### ✅ Complete Metadata and Links

- All features include proper `links` arrays following CSAPI relationship standards
- Link relations include: `self`, `parent`, `system`, `deployment`, `datastreams`, `events`, etc.
- Properties include full metadata: `name`, `description`, `featureType`, relationship IDs

### ✅ Rich Test Coverage

- **Core Resources**: systems, deployments, procedures, samplingFeatures, properties
- **Dynamic Data**: datastreams, observations, commands, feasibility, controlStreams, systemEvents
- **Relationships**: Parent-child hierarchies, system-deployment associations, FOI references
- **Advanced Filtering**: Resources with relationship arrays (procedureIds, foiIds, observedProperties, controlledProperties, systemIds)
- **Edge Cases**: Multiple geometry types, various temporal scopes, nested collections

## Fixture Categories

### Feature Resources (Part 1)

| File                    | Description                 | Geometry             | Key Features                                                                 |
| ----------------------- | --------------------------- | -------------------- | ---------------------------------------------------------------------------- |
| `systems.json`          | System collection           | ✅ Point, Polygon    | Multiple systems with parent/child relationships, procedure/FOI associations |
| `deployments.json`      | Deployment collection       | ✅ Point             | Parent-child hierarchy, system associations, temporal validity               |
| `procedures.json`       | Procedure collection        | ❌ null              | Method documentation, property associations                                  |
| `samplingFeatures.json` | Sampling feature collection | ✅ Point, LineString | System associations, FOI references                                          |
| `properties.json`       | Property definitions        | ❌ N/A               | Observable and controllable properties, units, definitions                   |

### Dynamic Resources (Part 2)

| File                  | Description               | Geometry | Key Features                                      |
| --------------------- | ------------------------- | -------- | ------------------------------------------------- |
| `datastreams.json`    | Datastream collection     | ❌ null  | System/deployment associations, schema references |
| `observations.json`   | Observation collection    | ❌ null  | Results, phenomenon times, observed properties    |
| `commands.json`       | Command collection        | ❌ null  | Status and result references                      |
| `controlStreams.json` | Control stream collection | ❌ null  | System control interfaces                         |
| `feasibility.json`    | Feasibility collection    | ❌ null  | Planning and scheduling                           |
| `systemEvents.json`   | System event collection   | ❌ null  | Event types, timestamps, system references        |
| `systemHistory.json`  | System history collection | ❌ null  | Revision tracking, versioning                     |

### Individual Resources

Individual resource files (e.g., `system_sys-001.json`, `deployment_dep-001.json`) provide detailed single-item examples for testing individual resource retrieval.

### Encodings

Files prefixed with `encodings_` demonstrate various encoding formats:

- GeoJSON (Part 1)
- SensorML-JSON (Part 1)
- SWE Common 3.0 JSON (Part 2)
- OM-JSON (Part 2)

### Endpoints

Files prefixed with `endpoint_` provide collection listings for canonical CSAPI endpoints.

## Usage in Tests

### Loading Fixtures

The unified loader always resolves to this directory:

```typescript
import { loadFixture } from '../fixture_loader';

// Automatically loads from fixtures/ogc-api/csapi/examples/
const systems = loadFixture('default', 'systems');
```

### Fixture Mode Testing

```bash
# Default: uses these unified fixtures
npm test -- src/ogc-api/csapi/__tests__/

# Specific test file
npm test -- src/ogc-api/csapi/__tests__/systems.spec.ts
```

### Live Mode Testing

```bash
CSAPI_LIVE=true CSAPI_API_ROOT=https://your.csapi.server npm test
```

## Test Traceability

Each fixture maps to:

1. **Requirement(s)**: Normative `/req/...` clauses from OGC 23-001 and OGC 23-002
2. **Test File(s)**: Jest specs in `src/ogc-api/csapi/__tests__/`
3. **Use Cases**: Specific testing scenarios (basic CRUD, filtering, relationships, encodings)

See [Fixture_Index.md](../../../docs/csapi/_tests_/Fixture_Index.md) for detailed traceability matrix.

## Advanced Filtering Resources

Resources designed specifically for advanced filtering tests include:

- **sys-1, sys-3**: Systems with parent, procedure, FOI, and property associations
- **dep-1, dep-2**: Deployments with system, FOI, and property arrays
- **proc-2**: Procedure with property associations
- **sf-9**: Sampling feature with FOI and property arrays
- **prop-def-1**: Property definition with baseProperty and objectTypes

These enable testing of:

- ID-based filtering with wildcards
- Keyword search (case-insensitive)
- Parent/child relationship filtering
- Procedure/FOI association filtering
- Observed/controlled property filtering
- Combined AND/OR filter logic

## Geometry Examples

### Point Geometry

Used for individual sensors, stations, or specific locations:

```json
"geometry": {
  "type": "Point",
  "coordinates": [-122.4194, 37.7749]
}
```

### Polygon Geometry

Used for area-based systems or coverage zones:

```json
"geometry": {
  "type": "Polygon",
  "coordinates": [[...]]
}
```

### LineString Geometry

Used for transect-based sampling or linear features:

```json
"geometry": {
  "type": "LineString",
  "coordinates": [...]
}
```

### Null Geometry

Explicitly set for non-spatial resources:

```json
"geometry": null
```

## Link Relations

Standard link relations used throughout fixtures:

- `self`: Canonical URL for the resource
- `parent`: Parent resource in hierarchy
- `system`: Associated system
- `deployment`: Associated deployment
- `procedure`: Associated procedure
- `datastreams`: Datastreams from/to this resource
- `observations`: Observations related to this resource
- `events`: System events
- `subsystems`: Child systems

## Maintenance Guidelines

When updating fixtures:

1. **Preserve Geometry**: Ensure spatial resources maintain valid geometry
2. **Maintain Links**: Keep link arrays complete and following standards
3. **Document Changes**: Add comments explaining purpose of new fixtures
4. **Run Tests**: Verify all tests pass after changes
5. **Check Compliance**: Validate against CSAPI Part 1/2 specifications

## Migration from Legacy Fixtures

The previous `sample-data-hub` and `advanced` directories have been merged:

- **sample-data-hub**: Provided comprehensive fixtures with good link coverage
- **advanced**: Provided relationship-rich data for filtering tests
- **examples** (this directory): Combines both with enhanced geometry, links, and metadata

All test code and documentation has been updated to reference this unified location.

## Related Documentation

- [Fixture Index](../../../docs/csapi/_tests_/Fixture_Index.md): Detailed fixture descriptions and traceability
- [Test Harness Guide](../../../docs/csapi/_tests_/CSAPI_Test_Harness_Guide.md): How to run and maintain tests
- [Test Design Matrix](../../../docs/csapi/_tests_/CSAPI_Test_Design_Matrix_v2.4.md): Requirement coverage

---

**Prepared for**: OGC API – Connected Systems Client Implementation  
**Last Updated**: 2024  
**Standards**: OGC 23-001 (Part 1), OGC 23-002 (Part 2)
