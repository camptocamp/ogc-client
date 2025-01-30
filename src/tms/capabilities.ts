import {
  findChildElement,
  findChildrenElement,
  getElementAttribute,
  getElementText,
  getRootElement
} from '../shared/xml-utils.js';
import { TileMapLayer} from './models.js';
import { XmlDocument, XmlElement } from '@rgrove/parse-xml';


export function readInfoFromCapabilities(
  capabilitiesDoc: XmlDocument
): {
  title: string;
  abstract: string;
} {
  const service = getRootElement(capabilitiesDoc)
  return {
    title: getElementText(findChildElement(service, 'Title')),
    abstract: getElementText(findChildElement(service, 'Abstract')),
  };
}

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
