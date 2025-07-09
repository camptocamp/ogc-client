import { OgcApiDocument } from "../ogc-api/model.js";

export type DataQueryTypes = 
    "items" |
    "locations" | 
    "cube" |
    "area"

export interface OgcEDRDocument extends OgcApiDocument {
    data_queries: {
        [K in DataQueryTypes]: {
            link: {
                href: string;
                rel: string;
            }
        }
    }
}

