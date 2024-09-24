/**
 * Expressed as minx, miny, maxx, maxy
 */
export type BoundingBox = [number, number, number, number];

export type CrsCode = string;

export interface Address {
  deliveryPoint?: string;
  city?: string;
  administrativeArea?: string;
  postalCode?: string;
  country?: string;
}

export interface Contact {
  name?: string;
  organization?: string;
  position?: string;
  phone?: string;
  fax?: string;
  address?: Address;
  email?: string;
}

export interface Provider {
  name?: string;
  site?: string;
  contact?: Contact;
}

export type GenericEndpointInfo = {
  name: string;
  title: string;
  abstract: string;
  fees: string;
  constraints: string;
  keywords: string[];
  provider?: Provider;
  /**
   * Can contain the list of outputFormats from a WFS GetCapabilities,
   * or the list of 'Formats' from a WMS GetCapabilities
   */
  outputFormats?: MimeType[];
};

export type MimeType = string;

export interface FetchOptions {
  headers?: Record<string, string>;
  mode?: 'same-origin' | 'cors' | 'no-cors';
  credentials?: 'same-origin' | 'include' | 'omit';
  redirect?: 'follow' | 'error';
  referrer?: string;
  integrity?: string;
}

export interface LayerStyle {
  name: string;
  title: string;
  abstract?: string;
  /**
   * May not be defined; a GetLegendGraphic operation should work in any case
   */
  legendUrl?: string;
}
