import { parseProperty } from './property.js';
import type { Property } from '../model.js';

/**
 * Tests for parseProperty() — Phase 5, Task 1.
 *
 * Fixtures are spec-derived from the OGC 23-001 DerivedProperty schema.
 * Live-validated against 7 OSH Property resources (February 2026, Issue #131).
 *
 * @see https://docs.ogc.org/is/23-001/23-001.html#_property_resources
 */
describe('parseProperty', () => {
  it('extracts all fields from a full Property object', () => {
    const input = {
      id: 'air-temp',
      uniqueId: 'urn:x-ogc:def:property:noaa::AirTemperature',
      label: 'Air Temperature',
      description: 'Temperature of the ambient air',
      baseProperty: 'http://qudt.org/vocab/quantitykind/Temperature',
      objectType:
        'http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement',
      statistic: 'http://www.opengis.net/def/property/OGC/0/Mean',
      links: [
        {
          rel: 'self',
          href: '/properties/air-temp',
          type: 'application/json',
        },
      ],
    };

    const result: Property = parseProperty(input);

    expect(result.id).toBe('air-temp');
    expect(result.uniqueId).toBe('urn:x-ogc:def:property:noaa::AirTemperature');
    expect(result.label).toBe('Air Temperature');
    expect(result.description).toBe('Temperature of the ambient air');
    expect(result.baseProperty).toBe(
      'http://qudt.org/vocab/quantitykind/Temperature'
    );
    expect(result.objectType).toBe(
      'http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement'
    );
    expect(result.statistic).toBe(
      'http://www.opengis.net/def/property/OGC/0/Mean'
    );
    expect(result.links).toEqual([
      { rel: 'self', href: '/properties/air-temp', type: 'application/json' },
    ]);
  });

  it('handles a minimal Property with only required fields', () => {
    const input = {
      uniqueId: 'urn:x-ogc:def:property:noaa::WindSpeed',
      label: 'Wind Speed',
      baseProperty: 'http://qudt.org/vocab/quantitykind/Speed',
    };

    const result: Property = parseProperty(input);

    expect(result.uniqueId).toBe('urn:x-ogc:def:property:noaa::WindSpeed');
    expect(result.label).toBe('Wind Speed');
    expect(result.baseProperty).toBe(
      'http://qudt.org/vocab/quantitykind/Speed'
    );
    expect(result.id).toBeUndefined();
    expect(result.description).toBeUndefined();
    expect(result.objectType).toBeUndefined();
    expect(result.statistic).toBeUndefined();
    expect(result.links).toBeUndefined();
  });

  it('omits optional fields when they are absent', () => {
    const input = {
      uniqueId: 'urn:x-ogc:def:property:example::Humidity',
      label: 'Relative Humidity',
      baseProperty: 'http://qudt.org/vocab/quantitykind/RelativeHumidity',
    };

    const result: Property = parseProperty(input);

    expect(result).not.toHaveProperty('description');
    expect(result).not.toHaveProperty('objectType');
    expect(result).not.toHaveProperty('statistic');
    expect(result).not.toHaveProperty('links');
  });

  it('preserves an empty links array', () => {
    const input = {
      uniqueId: 'urn:x-ogc:def:property:example::Pressure',
      label: 'Barometric Pressure',
      baseProperty: 'http://qudt.org/vocab/quantitykind/Pressure',
      links: [],
    };

    const result: Property = parseProperty(input);

    expect(result.links).toEqual([]);
  });

  it('throws on non-object input', () => {
    expect(() => parseProperty(null)).toThrow(
      'parseProperty: input must be a non-null object'
    );
    expect(() => parseProperty(42)).toThrow(
      'parseProperty: input must be a non-null object'
    );
    expect(() => parseProperty('string')).toThrow(
      'parseProperty: input must be a non-null object'
    );
  });

  it('omits id when the field is absent', () => {
    const input = {
      uniqueId: 'urn:x-ogc:def:property:example::SoilMoisture',
      label: 'Soil Moisture',
      baseProperty: 'http://qudt.org/vocab/quantitykind/VolumeFraction',
    };

    const result: Property = parseProperty(input);

    expect(result).not.toHaveProperty('id');
    expect(result.uniqueId).toBe(
      'urn:x-ogc:def:property:example::SoilMoisture'
    );
    expect(result.label).toBe('Soil Moisture');
  });

  describe('live OSH Property validation (Issue #131)', () => {
    // Representative sample from http://45.55.99.236:8080/sensorhub/api/properties
    // Captured February 2026 — all 7 items parse identically to this pattern.
    const oshProperty = {
      id: '040g',
      uniqueId: 'urn:x-odas:property:sound-source-doa',
      label: 'Sound Source Direction of Arrival',
      description:
        'The instantaneous direction from which a sound source is perceived by a microphone array.',
      baseProperty: 'http://qudt.org/vocab/quantitykind/Angle',
    };

    it('parses a live OSH Property resource correctly', () => {
      const result: Property = parseProperty(oshProperty);

      expect(result.id).toBe('040g');
      expect(result.uniqueId).toBe('urn:x-odas:property:sound-source-doa');
      expect(result.label).toBe('Sound Source Direction of Arrival');
      expect(result.description).toBe(
        'The instantaneous direction from which a sound source is perceived by a microphone array.'
      );
      expect(result.baseProperty).toBe(
        'http://qudt.org/vocab/quantitykind/Angle'
      );
    });

    it('omits optional fields absent from live OSH responses', () => {
      const result: Property = parseProperty(oshProperty);

      expect(result).not.toHaveProperty('objectType');
      expect(result).not.toHaveProperty('statistic');
      expect(result).not.toHaveProperty('links');
    });
  });
});
