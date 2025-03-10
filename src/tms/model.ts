import { BoundingBox, CrsCode, MimeType } from '../shared/models.js';

export interface TileMapService {
  version: string;
  services?: string;
  title: string;
  abstract?: string;
  keywords?: string[];
  contactInformation?: ContactInformation;
  tileMaps?: TileMapReference[];
}

export interface TmsEndpointInfo {
  title: string;
  abstract?: string;
  keywords?: string[];
  contact?: ContactInformation;
}

export interface TileMapInfo {
  version: string;
  tileMapService: string;
  title: string;
  abstract?: string;
  keywords?: string[];
  metadata?: Metadata[];
  attribution?: Attribution;
  webMapContext?: string;
  face?: number;
  srs: CrsCode;
  boundingBox: BoundingBox;
  origin: Origin;
  tileFormat: TileFormat;
  tileSets: {
    profile: string;
    tileSets: TileSet[];
  };
}

export interface ContactInformation {
  contactPersonPrimary?: {
    contactPerson?: string;
    contactOrganization?: string;
  };
  contactPosition?: string;
  contactAddress?: {
    addressType?: string;
    address?: string;
    city?: string;
    stateOrProvince?: string;
    postCode?: string;
    country?: string;
  };
  contactVoiceTelephone?: string;
  contactFacsimileTelephone?: string;
  contactElectronicMailAddress?: string;
}

export interface Metadata {
  type: string;
  mimeType: MimeType;
  href: string;
}

export interface Attribution {
  title: string;
  logo?: {
    width: number;
    height: number;
    href: string;
    mimeType: MimeType;
  };
}

export interface TileMapReference {
  title: string;
  srs: CrsCode;
  profile: string;
  href: string;
}

export interface TileSet {
  href: string;
  unitsPerPixel: number;
  order: number;
  minrow?: number;
  maxrow?: number;
  mincol?: number;
  maxcol?: number;
}

export interface TileFormat {
  width: number;
  height: number;
  mimeType: MimeType;
  extension: string;
}

export interface Origin {
  x: number;
  y: number;
}
