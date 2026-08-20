/**
 * Type compilation and discriminator tests for SWE Common 3.0 types.
 *
 * These tests verify that:
 * - All interfaces compile correctly and are importable
 * - Discriminated unions resolve via `type` property
 * - Recursive nesting (DataRecord → AnyComponent → DataRecord) compiles
 */

import type {
  // Unit / Constraints
  UnitOfMeasure,
  AllowedValues,
  AllowedTokens,
  // Nil values
  NilValue,
  // Special value types
  NumberOrSpecial,
  // Encoded values
  EncodedValues,
  AssociationAttributeGroup,
  // Field wrappers
  DataField,
  // Aggregate components
  DataRecord,
  GeometryConstraint,
  // Array components
  DataArray,
  Matrix,
  // Unions
  DataEncoding,
  AnyComponent,
  SweComponentType,
  SweEncodingType,
} from './types.js';

// ========================================
// Discriminated Union Tests
// ========================================

describe('AnyComponent discriminated union', () => {
  it('narrows to SweQuantity via type discriminator', () => {
    const component: AnyComponent = {
      type: 'Quantity',
      definition: 'http://qudt.org/vocab/quantitykind/Temperature',
      label: 'Temperature',
      uom: { code: 'degC' },
      value: 23.5,
    };
    expect(component.type).toBe('Quantity');
    if (component.type === 'Quantity') {
      expect(component.uom.code).toBe('degC');
      expect(component.value).toBe(23.5);
    }
  });

  it('narrows to DataRecord via type discriminator', () => {
    const component: AnyComponent = {
      type: 'DataRecord',
      definition: 'http://example.com/WeatherData',
      label: 'Weather',
      fields: [
        {
          name: 'temp',
          type: 'Quantity',
          uom: { code: 'degC' },
        } as unknown as DataField,
      ],
    };
    expect(component.type).toBe('DataRecord');
    if (component.type === 'DataRecord') {
      expect(component.fields).toHaveLength(1);
      expect(component.fields[0].name).toBe('temp');
    }
  });

  it('narrows to SweBoolean via type discriminator', () => {
    const component: AnyComponent = {
      type: 'Boolean',
      definition: 'http://example.com/IsActive',
      label: 'Active',
      value: true,
    };
    expect(component.type).toBe('Boolean');
    if (component.type === 'Boolean') {
      expect(component.value).toBe(true);
    }
  });

  it('narrows to SweText via type discriminator', () => {
    const component: AnyComponent = {
      type: 'Text',
      definition: 'http://example.com/StationName',
      label: 'Station Name',
      value: 'Station A',
    };
    expect(component.type).toBe('Text');
    if (component.type === 'Text') {
      expect(component.value).toBe('Station A');
    }
  });

  it('narrows to DataArray via type discriminator', () => {
    const component: AnyComponent = {
      type: 'DataArray',
      elementType: { name: 'record' },
      values: [1, 2, 3],
    };
    expect(component.type).toBe('DataArray');
    if (component.type === 'DataArray') {
      expect(component.elementType.name).toBe('record');
      expect(component.values).toEqual([1, 2, 3]);
    }
  });

  it('narrows to Vector via type discriminator', () => {
    const component: AnyComponent = {
      type: 'Vector',
      definition: 'http://example.com/Location',
      label: 'Location',
      referenceFrame: 'http://www.opengis.net/def/crs/EPSG/0/4326',
      coordinates: [{ name: 'lat' }, { name: 'lon' }],
    };
    expect(component.type).toBe('Vector');
    if (component.type === 'Vector') {
      expect(component.referenceFrame).toContain('EPSG');
      expect(component.coordinates).toHaveLength(2);
    }
  });

  it('narrows to SweGeometry via type discriminator', () => {
    const component: AnyComponent = {
      type: 'Geometry',
      definition: 'http://example.com/Footprint',
      label: 'Footprint',
      srs: 'http://www.opengis.net/def/crs/EPSG/0/4326',
      value: { type: 'Point', coordinates: [1.0, 2.0] },
    };
    expect(component.type).toBe('Geometry');
    if (component.type === 'Geometry') {
      expect(component.srs).toContain('EPSG');
      expect(component.value?.type).toBe('Point');
    }
  });

  it('narrows range components via type discriminator', () => {
    const qr: AnyComponent = {
      type: 'QuantityRange',
      uom: { code: 'degC' },
      value: [-10, 40],
    };
    expect(qr.type).toBe('QuantityRange');
    if (qr.type === 'QuantityRange') {
      expect(qr.uom.code).toBe('degC');
      expect(qr.value).toEqual([-10, 40]);
    }

    const cr: AnyComponent = {
      type: 'CountRange',
      value: [0, 100],
    };
    expect(cr.type).toBe('CountRange');

    const tr: AnyComponent = {
      type: 'TimeRange',
      uom: { href: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian' },
      value: ['2026-01-01T00:00:00Z', '2026-12-31T23:59:59Z'],
    };
    expect(tr.type).toBe('TimeRange');

    const catr: AnyComponent = {
      type: 'CategoryRange',
      value: ['low', 'high'],
    };
    expect(catr.type).toBe('CategoryRange');
  });

  it('covers all 16 component types in the union', () => {
    const types: SweComponentType[] = [
      'Boolean',
      'Count',
      'Quantity',
      'Text',
      'Category',
      'Time',
      'CountRange',
      'QuantityRange',
      'TimeRange',
      'CategoryRange',
      'DataRecord',
      'Vector',
      'DataArray',
      'Matrix',
      'DataChoice',
      'Geometry',
    ];
    expect(types).toHaveLength(16);
    // All are unique
    expect(new Set(types).size).toBe(16);
  });
});

describe('DataEncoding discriminated union', () => {
  it('narrows to TextEncoding', () => {
    const enc: DataEncoding = {
      type: 'TextEncoding',
      tokenSeparator: ',',
      blockSeparator: '\n',
    };
    expect(enc.type).toBe('TextEncoding');
    if (enc.type === 'TextEncoding') {
      expect(enc.tokenSeparator).toBe(',');
    }
  });

  it('narrows to JSONEncoding', () => {
    const enc: DataEncoding = {
      type: 'JSONEncoding',
      recordsAsArrays: true,
    };
    expect(enc.type).toBe('JSONEncoding');
    if (enc.type === 'JSONEncoding') {
      expect(enc.recordsAsArrays).toBe(true);
    }
  });

  it('narrows to BinaryEncoding', () => {
    const enc: DataEncoding = {
      type: 'BinaryEncoding',
      byteOrder: 'bigEndian',
      byteEncoding: 'base64',
      members: [
        {
          type: 'Component',
          ref: '/temp',
          dataType: 'http://www.opengis.net/def/dataType/OGC/0/float64',
        },
      ],
    };
    expect(enc.type).toBe('BinaryEncoding');
    if (enc.type === 'BinaryEncoding') {
      expect(enc.byteOrder).toBe('bigEndian');
      expect(enc.members).toHaveLength(1);
    }
  });

  it('narrows to XMLEncoding', () => {
    const enc: DataEncoding = {
      type: 'XMLEncoding',
      namespace: 'http://www.opengis.net/swe/2.0',
    };
    expect(enc.type).toBe('XMLEncoding');
  });

  it('covers all 4 encoding types', () => {
    const types: SweEncodingType[] = [
      'TextEncoding',
      'JSONEncoding',
      'BinaryEncoding',
      'XMLEncoding',
    ];
    expect(types).toHaveLength(4);
    expect(new Set(types).size).toBe(4);
  });
});

// ========================================
// Recursive Nesting
// ========================================

describe('recursive nesting', () => {
  it('compiles DataRecord containing nested DataRecord field', () => {
    const inner: DataRecord = {
      type: 'DataRecord',
      fields: [
        {
          name: 'temp',
          type: 'Quantity',
          uom: { code: 'degC' },
        } as unknown as DataField,
      ],
    };
    const outer: DataRecord = {
      type: 'DataRecord',
      fields: [{ name: 'weather', ...inner } as unknown as DataField],
    };
    expect(outer.type).toBe('DataRecord');
    expect(outer.fields[0].name).toBe('weather');
  });

  it('compiles DataArray with DataRecord elementType', () => {
    const arr: DataArray = {
      type: 'DataArray',
      elementType: { name: 'observation' },
      elementCount: {
        type: 'ElementCount',
        value: 10,
      },
      encoding: {
        type: 'JSONEncoding',
      },
      values: [],
    };
    expect(arr.type).toBe('DataArray');
    expect(arr.elementType.name).toBe('observation');
  });

  it('compiles Matrix with elementType and referenceFrame', () => {
    const m: Matrix = {
      type: 'Matrix',
      elementType: { name: 'row' },
      referenceFrame: 'http://www.opengis.net/def/crs/EPSG/0/4326',
    };
    expect(m.type).toBe('Matrix');
    expect(m.referenceFrame).toContain('EPSG');
  });
});

// ========================================
// Supporting Types
// ========================================

describe('supporting types', () => {
  it('creates valid UnitOfMeasure with UCUM code', () => {
    const uom: UnitOfMeasure = { code: 'm/s', label: 'meters per second' };
    expect(uom.code).toBe('m/s');
  });

  it('creates valid UnitOfMeasure with URI', () => {
    const uom: UnitOfMeasure = { href: 'http://qudt.org/vocab/unit/DEG_C' };
    expect(uom.href).toContain('DEG_C');
  });

  it('creates AllowedValues with intervals', () => {
    const av: AllowedValues = {
      type: 'AllowedValues',
      intervals: [[-40, 85]],
      significantFigures: 4,
    };
    expect(av.intervals).toHaveLength(1);
  });

  it('creates AllowedTokens with enumeration', () => {
    const at: AllowedTokens = {
      type: 'AllowedTokens',
      values: ['low', 'medium', 'high'],
    };
    expect(at.values).toHaveLength(3);
  });

  it('creates AllowedTokens with pattern', () => {
    const at: AllowedTokens = {
      type: 'AllowedTokens',
      pattern: '^[A-Z]{3}$',
    };
    expect(at.pattern).toBe('^[A-Z]{3}$');
  });

  it('creates NilValue with reason and value', () => {
    const nv: NilValue<number> = {
      reason: 'http://www.opengis.net/def/nil/OGC/0/BelowDetectionRange',
      value: -9999,
    };
    expect(nv.reason).toContain('BelowDetectionRange');
    expect(nv.value).toBe(-9999);
  });

  it('handles NumberOrSpecial values', () => {
    const values: NumberOrSpecial[] = [
      42,
      'NaN',
      'Infinity',
      '-Infinity',
      '+Infinity',
    ];
    expect(values).toHaveLength(5);
  });

  it('handles EncodedValues as array', () => {
    const ev: EncodedValues = [1, 2, 3, 4];
    expect(Array.isArray(ev)).toBe(true);
  });

  it('handles EncodedValues as external reference', () => {
    const ev: EncodedValues = {
      href: 'http://example.com/data/observations.csv',
      title: 'Observation data',
    };
    expect((ev as AssociationAttributeGroup).href).toContain('observations');
  });

  it('creates GeometryConstraint', () => {
    const gc: GeometryConstraint = {
      geomTypes: ['Point', 'Polygon'],
    };
    expect(gc.geomTypes).toHaveLength(2);
  });
});
