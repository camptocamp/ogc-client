import { DataQueryTypes } from "../ogc-common/common.js";
import { OgcApiCollectionInfo, OgcApiDocument } from "../ogc-common/model.js";


export interface OgcEDRCollectionInfo extends OgcApiCollectionInfo {
  data_queries?: {
    [K in DataQueryTypes]?: {
      link: {
        href: string;
        rel: string;
      };
    };
  };
}

export interface OgcEDRDocument extends OgcApiDocument {
  collections: OgcEDRCollectionInfo[];
}
