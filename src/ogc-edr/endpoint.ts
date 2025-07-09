import OgcApiEndpoint from "../ogc-api/endpoint.js";
import { parseDataQueries } from "./info.js";
import { OgcApiDocument } from "../ogc-api/model.js";
import { fetchRoot } from "../ogc-api/link-utils.js";
import { DataQueryTypes, OgcEDRDocument } from "./model.js";




export default class OgcApiEDREndpoint extends OgcApiEndpoint {
  private edr_root_: Promise<OgcEDRDocument>;

  protected get edr_root(): Promise<OgcEDRDocument> {
        if (!this.edr_root_) {
        this.edr_root_ = fetchRoot(this.baseUrl).catch((e) => {
            throw new Error(`The endpoint appears non-conforming, the following error was encountered:
    ${e.message}`);
        });
        }
        return this.edr_root_;
    }

  /**
   * A Promise which resolves to the data query types
   */
  get dataQueries(): Promise<Array<DataQueryTypes>> {
    return this.edr_root.then(parseDataQueries);
  }
}


