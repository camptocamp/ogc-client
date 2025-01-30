import { findChildElement, findChildrenElement, getElementAttribute, getRootElement } from "../shared/xml-utils";
import { TileMapLayer} from "./models";
import { XmlDocument, XmlElement } from '@rgrove/parse-xml';

export function readLayersFromCapabilities(doc: XmlDocument): TileMapLayer[] {
  const services = findChildElement(
      getRootElement(doc),
      'TileMaps'
    );

  return findChildrenElement(services, 'TileMap').map(tmsServiceEl =>
      parseTmsLayer(tmsServiceEl)
    );
}

function parseTmsLayer(tmsServiceEl: XmlElement): TileMapLayer {
  return {
    extension: getElementAttribute(tmsServiceEl, 'extension'),
    href: getElementAttribute(tmsServiceEl, 'href'),
    title: getElementAttribute(tmsServiceEl, 'title'),
    profile: getElementAttribute(tmsServiceEl, 'profile'),
    srs: getElementAttribute(tmsServiceEl, 'srs')
  }
}