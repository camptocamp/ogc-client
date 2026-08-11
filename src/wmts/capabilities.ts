import type { BoundingBox, LayerStyle } from '../shared/models.js';
import { readProviderFromCapabilities } from '../shared/ows.js';
import {
  findChildElement,
  findChildrenElement,
  getElementAttribute,
  getElementText,
  getRootElement,
} from '../shared/xml-utils.js';
import type {
  WmtsLayerResourceLink,
  MatrixSetLink,
  TileMatrix,
  WmtsEndpointInfo,
  WmtsLayer,
  WmtsMatrixSet,
} from './model.js';
import type { XmlDocument, XmlElement } from '@rgrove/parse-xml';

function parseBBox(xmlElement: XmlElement): BoundingBox {
  const result = ['LowerCorner', 'UpperCorner']
    .map((elName) => findChildElement(xmlElement, elName))
    .map((cornerEl) => getElementText(cornerEl).split(' '))
    .reduce((prev, curr) => [...prev, ...curr])
    .map(parseFloat) as BoundingBox;
  if (result.some(Number.isNaN)) return null;
  return result;
}

/**
 * Parse a URN/URL CRS string into a short name format
 * @param crsString - URN/URL CRS string (e.g. "urn:ogc:def:crs:EPSG::4326" or "http://www.opengis.net/def/crs/EPSG/0/4326")
 * @returns The parsed CRS string in short name format (e.g. "EPSG:4326")
 */
function parseCRS(crsString: string): string {
  if (!crsString) return '';
  const segments = crsString.trim().split(/[/:]+/).filter(Boolean);
  if (segments.length === 0) return crsString;
  const code = segments.pop() || '';
  let authority = null;
  const knownAuthorities = ['EPSG', 'ESRI', 'IAU', 'IGNF', 'NKG', 'OGC'];
  while (segments.length > 0) {
    const candidate = segments.pop() || '';
    if (knownAuthorities.includes(candidate.toUpperCase())) {
      authority = candidate.toUpperCase();
      break;
    }
  }
  return authority ? `${authority}:${code}` : code;
}

export function readInfoFromCapabilities(
  capabilitiesDoc: XmlDocument
): WmtsEndpointInfo {
  const rootEl = getRootElement(capabilitiesDoc);
  const service = findChildElement(rootEl, 'ServiceIdentification');
  const keywords = findChildrenElement(
    findChildElement(service, 'Keywords'),
    'Keyword'
  ).map(getElementText);
  const metadata = findChildElement(rootEl, 'OperationsMetadata');
  const getTileOperation = findChildrenElement(metadata, 'Operation').find(
    (el) => getElementAttribute(el, 'name') == 'GetTile'
  );
  const getTileUrls = findChildrenElement(getTileOperation, 'Get', true).reduce(
    (prev, curr) => {
      const encodingType = getElementText(
        findChildElement(curr, 'Value', true)
      );
      const url = getElementAttribute(curr, 'xlink:href');
      if (encodingType.toLowerCase() === 'restful')
        return { ...prev, rest: url };
      return { ...prev, kvp: url };
    },
    {}
  );

  return {
    title: getElementText(findChildElement(service, 'Title')),
    name: getElementText(findChildElement(service, 'ServiceType')),
    abstract: getElementText(findChildElement(service, 'Abstract')),
    fees: getElementText(findChildElement(service, 'Fees')),
    constraints: getElementText(findChildElement(service, 'AccessConstraints')),
    keywords,
    provider: readProviderFromCapabilities(capabilitiesDoc),
    getTileUrls,
  };
}

export function readMatrixSetsFromCapabilities(
  capabilitiesDoc: XmlDocument
): WmtsMatrixSet[] {
  function parseMatrixSet(element: XmlElement): TileMatrix {
    const topLeft = getElementText(findChildElement(element, 'TopLeftCorner'))
      .split(' ')
      .map(parseFloat) as [number, number];
    return {
      identifier: getElementText(findChildElement(element, 'Identifier')),
      tileWidth: parseInt(
        getElementText(findChildElement(element, 'TileWidth'))
      ),
      tileHeight: parseInt(
        getElementText(findChildElement(element, 'TileHeight'))
      ),
      matrixWidth: parseInt(
        getElementText(findChildElement(element, 'MatrixWidth'))
      ),
      matrixHeight: parseInt(
        getElementText(findChildElement(element, 'MatrixHeight'))
      ),
      scaleDenominator: parseFloat(
        getElementText(findChildElement(element, 'ScaleDenominator'))
      ),
      topLeft,
    };
  }
  const contents = findChildElement(
    getRootElement(capabilitiesDoc),
    'Contents'
  );
  const matrixSets = findChildrenElement(contents, 'TileMatrixSet');
  return matrixSets.map((element) => {
    const wellKnownScaleSet = getElementText(
      findChildElement(element, 'WellKnownScaleSet')
    );
    const boundingBox = parseBBox(findChildElement(element, 'BoundingBox'));
    return {
      identifier: getElementText(findChildElement(element, 'Identifier')),
      crs: parseCRS(getElementText(findChildElement(element, 'SupportedCRS'))),
      tileMatrices: findChildrenElement(element, 'TileMatrix').map(
        parseMatrixSet
      ),
      ...(boundingBox && { boundingBox }),
      ...(wellKnownScaleSet && { wellKnownScaleSet }),
    };
  });
}

export function readLayersFromCapabilities(
  capabilitiesDoc: XmlDocument
): WmtsLayer[] {
  const rootEl = getRootElement(capabilitiesDoc);
  const contentsEl = findChildElement(rootEl, 'Contents');

  /**
   * Get the TileMatrixSet CRS
   * @param contentsEl - Contents
   * @param identifier - TileMatrixSet identifier
   * @returns The parsed supported CRS of the TileMatrixSet
   */
  function getMatrixSetCrs(contentsEl: XmlElement, identifier: string): string {
    const matrixSet = findChildrenElement(contentsEl, 'TileMatrixSet').find(
      (matrixSetEl) => {
        const identifierEl = findChildElement(matrixSetEl, 'Identifier');
        return getElementText(identifierEl) === identifier;
      }
    );
    const supportedCrsEl = findChildElement(matrixSet, 'SupportedCRS');
    return parseCRS(getElementText(supportedCrsEl));
  }

  /**
   * Get the parameters of the TileMatrixSetLink
   * @param element - TileMatrixSetLink
   * @returns
   */
  function parseMatrixSetLink(element: XmlElement): MatrixSetLink {
    const identifier = getElementText(
      findChildElement(element, 'TileMatrixSet')
    );
    const crs = getMatrixSetCrs(contentsEl, identifier);

    return {
      identifier,
      crs,
      limits: findChildrenElement(element, 'TileMatrixLimits', true).map(
        (element) => ({
          tileMatrix: getElementText(findChildElement(element, 'TileMatrix')),
          minTileRow: parseInt(
            getElementText(findChildElement(element, 'MinTileRow'))
          ),
          minTileCol: parseInt(
            getElementText(findChildElement(element, 'MinTileCol'))
          ),
          maxTileRow: parseInt(
            getElementText(findChildElement(element, 'MaxTileRow'))
          ),
          maxTileCol: parseInt(
            getElementText(findChildElement(element, 'MaxTileCol'))
          ),
        })
      ),
    };
  }
  const getTileOperation = findChildrenElement(
    findChildElement(rootEl, 'OperationsMetadata'),
    'Operation'
  ).find((el) => getElementAttribute(el, 'name') == 'GetTile');
  const getKvpElt = findChildrenElement(getTileOperation, 'Get', true).filter(
    (elt) => {
      const encodingType = getElementText(findChildElement(elt, 'Value', true));
      return encodingType.toLowerCase() === 'kvp';
    }
  )[0];
  const getKvpUrl = getKvpElt
    ? getElementAttribute(getKvpElt, 'xlink:href')
    : '';
  const contents = findChildElement(rootEl, 'Contents');
  const layers = findChildrenElement(contents, 'Layer');
  return layers.map((element) => {
    const latLonBoundingBox = parseBBox(
      findChildElement(element, 'WGS84BoundingBox')
    );
    let defaultStyle = '';
    const styles = findChildrenElement(element, 'Style').map((element) => {
      const legendUrl = getElementAttribute(
        findChildElement(element, 'LegendURL'),
        'xlink:href'
      );
      const abstract = getElementText(findChildElement(element, 'Abstract'));
      const style: LayerStyle = {
        title: getElementText(findChildElement(element, 'Title')),
        name: getElementText(findChildElement(element, 'Identifier')),
        ...(abstract && { abstract }),
        ...(legendUrl && { legendUrl }),
      };
      if (getElementAttribute(element, 'isDefault') === 'true') {
        defaultStyle = style.name;
      }
      return style;
    });
    const outputFormats = findChildrenElement(element, 'Format').map(
      getElementText
    );
    const resourceLinks: WmtsLayerResourceLink[] = findChildrenElement(
      element,
      'ResourceURL'
    )
      .filter(
        (element) => getElementAttribute(element, 'resourceType') === 'tile'
      )
      .map((element) => {
        const format = getElementAttribute(element, 'format');
        const url = getElementAttribute(element, 'template');
        return { format, url, encoding: 'REST' as const };
      });
    if (getKvpUrl) {
      resourceLinks.push(
        ...outputFormats.map((format) => ({
          encoding: 'KVP' as const,
          url: getKvpUrl,
          format,
        }))
      );
    }
    const matrixSets = findChildrenElement(element, 'TileMatrixSetLink').map(
      parseMatrixSetLink
    );
    const dimensions = findChildrenElement(element, 'Dimension').map(
      (element) => {
        const identifier = getElementText(
          findChildElement(element, 'Identifier')
        );
        const defaultValue = getElementText(
          findChildElement(element, 'Default')
        );
        const values = findChildrenElement(element, 'Values').map(
          getElementText
        );
        return { identifier, defaultValue, values };
      }
    );
    return {
      name: getElementText(findChildElement(element, 'Identifier')),
      title: getElementText(findChildElement(element, 'Title')),
      abstract: getElementText(findChildElement(element, 'Abstract')),
      styles,
      resourceLinks,
      matrixSets,
      defaultStyle,
      ...(latLonBoundingBox && { latLonBoundingBox }),
      ...(dimensions && { dimensions }),
    } as WmtsLayer;
  });
}
