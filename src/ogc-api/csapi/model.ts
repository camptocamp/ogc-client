/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * OGC API – Connected Systems Model Definitions
 * Shared TypeScript interfaces for CSAPI entities.
 *
 * Includes:
 *   - Core CSAPI resource types
 *   - Systems-specific extensions (Part 2 §8)
 */

/**
 * Base resource type for CSAPI entities.
 * Allows arbitrary extension fields while preserving type safety.
 * @see OGC 23-001 §7.2
 */
export interface CSAPIResource<
  T extends Record<string, unknown> = Record<string, unknown>
> {
  id: string;
  type: string;
  /** Arbitrary extension properties permitted by the CSAPI model. */
  [key: string]: unknown;
}

/**
 * Represents a generic CSAPI FeatureCollection or Collection container.
 * Aligns with EDR and OGC API – Features schema semantics.
 * @template T extends CSAPIResource
 * @see OGC 23-001 §7.4
 */
export interface CSAPICollection<T extends CSAPIResource = CSAPIResource> {
  type: 'FeatureCollection';
  itemType?: string;
  features: T[];
  links?: Array<{ rel: string; href: string; type?: string }>;
}

/* -------------------------------------------------------------------------- */
/*                              Systems (Part 2 §8)                           */
/* -------------------------------------------------------------------------- */

/**
 * Represents a link relation associated with a System.
 * @see OGC 23-002 §8.1
 */
export interface CSAPISystemLink {
  rel: string;
  href: string;
  type?: string;
  title?: string;
}

/**
 * Represents a System resource (Feature) in CSAPI Part 2.
 * @see OGC 23-002 §8.1
 */
export interface CSAPISystem extends CSAPIResource {
  id: string;
  name?: string;
  description?: string;
  status?: string;
  links?: CSAPISystemLink[];
}

/**
 * Represents a Systems FeatureCollection response.
 */
export interface CSAPISystemCollection extends CSAPICollection<CSAPISystem> {
  itemType: 'System';
  features: CSAPISystem[];
}

/* -------------------------------------------------------------------------- */
/*                       Parameters and Other Shared Types                    */
/* -------------------------------------------------------------------------- */

/**
 * Generic CSAPIParameter type — retained for Part 1 compatibility.
 * @see OGC 23-001 §7.4
 */
export interface CSAPIParameter {
  name: string;
  description?: string;
  required?: boolean;
  schema?: Record<string, unknown>;
}
