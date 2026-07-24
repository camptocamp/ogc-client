import {
  BoundingBox,
  CrsCode,
  GenericEndpointInfo,
  MimeType,
} from '../shared/models.js';

export type WpsVersion = '1.0.0'; // extensible: | '2.0.0'

/** Summary of a process as advertised by GetCapabilities */
export interface WpsProcessSummary {
  identifier: string;
  title?: string;
  abstract?: string;
  processVersion?: string;
}

export type WpsInputType = 'literal' | 'boundingbox' | 'complex';

export interface WpsFormat {
  mimeType: MimeType;
  encoding?: string;
  schema?: string;
}

export interface WpsLiteralData {
  dataType?: string; // ows:DataType (e.g. 'float', 'string')
  defaultValue?: string;
  allowedValues?: string[]; // ows:AllowedValues/ows:Value
  anyValue?: boolean;
}

export interface WpsComplexData {
  default: WpsFormat;
  supported: WpsFormat[];
  maximumMegabytes?: number;
}

export interface WpsBoundingBoxData {
  defaultCrs: CrsCode;
  supportedCrs: CrsCode[];
}

export interface WpsProcessInput {
  identifier: string;
  title?: string;
  abstract?: string;
  minOccurs: number;
  maxOccurs: number;
  type: WpsInputType;
  literalData?: WpsLiteralData;
  complexData?: WpsComplexData;
  boundingBoxData?: WpsBoundingBoxData;
}

export interface WpsProcessOutput {
  identifier: string;
  title?: string;
  abstract?: string;
  type: WpsInputType; // literal | complex | boundingbox
  literalData?: { dataType?: string };
  complexData?: WpsComplexData; // default + supported formats (output format choice)
}

export interface WpsProcessFull extends WpsProcessSummary {
  statusSupported: boolean;
  storeSupported: boolean;
  inputs: WpsProcessInput[];
  outputs: WpsProcessOutput[];
}

/** Input value provided to execute() */
export interface WpsInputValue {
  identifier: string;
  // exactly one of the three depending on the input type
  literalValue?: string;
  /**
   * Complex content, e.g. GML/GeoJSON/WKT. The content is inserted raw when the
   * mimeType denotes XML (GML), otherwise it is wrapped in CDATA.
   */
  complexValue?: { mimeType: MimeType; content: string };
  boundingBoxValue?: { crs?: CrsCode; bbox: BoundingBox };
}

export interface WpsOutputSelection {
  identifier: string;
  mimeType?: MimeType;
  asReference?: boolean;
}

export interface WpsExecuteOptions {
  inputs: WpsInputValue[];
  outputs: WpsOutputSelection[];
  lineage?: boolean;
  storeExecuteResponse?: boolean;
  status?: boolean;
}

export type WpsExecuteStatus =
  | 'accepted'
  | 'started'
  | 'paused'
  | 'succeeded'
  | 'failed';

export interface WpsExecuteOutputResult {
  identifier: string;
  title?: string;
  // inline data OR reference (href) — one of the two
  data?: { mimeType?: MimeType; content: string };
  reference?: { href: string; mimeType?: MimeType };
}

export interface WpsExecuteResponse {
  status: WpsExecuteStatus;
  statusLocation?: string; // for asynchronous polling
  percentCompleted?: number;
  outputs: WpsExecuteOutputResult[];
  // on failure a ServiceExceptionError is thrown instead
}

export type WpsEndpointInfo = GenericEndpointInfo;
