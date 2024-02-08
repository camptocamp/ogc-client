import { XmlDocument, XmlElement } from '@rgrove/parse-xml';
import { BoundingBox, LayerStyle } from '../shared/models';
import {
  findChildElement,
  findChildrenElement,
  getElementAttribute,
  getElementText,
  getRootElement,
} from '../shared/xml-utils';
import {
  WmtsLayerResourceLink,
  MatrixSetLink,
  TileMatrix,
  WmtsEndpointInfo,
  WmtsLayer,
  WmtsMatrixSet,
} from './model';

function parseBBox(xmlElement: XmlElement): BoundingBox {
  const result = ['LowerCorner', 'UpperCorner']
    .map((elName) => findChildElement(xmlElement, elName))
    .map((cornerEl) => getElementText(cornerEl).split(' '))
    .reduce((prev, curr) => [...prev, ...curr])
    .map(parseFloat) as BoundingBox;
  if (result.some(Number.isNaN)) return null;
  return result;
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
      crs: getElementText(findChildElement(element, 'SupportedCRS')),
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
  function parseMatrixSetLink(element: XmlElement): MatrixSetLink {
    const fullMatrixSet = findChildrenElement(contentsEl, 'TileMatrixSet').find(
      (el) => getElementText(findChildElement(el, 'Identifier'))
    );
    return {
      identifier: getElementText(findChildElement(element, 'TileMatrixSet')),
      crs: getElementText(findChildElement(fullMatrixSet, 'SupportedCRS')),
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
      const style: LayerStyle = {
        title: getElementText(findChildElement(element, 'Title')),
        name: getElementText(findChildElement(element, 'Identifier')),
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
    const resourceUrls: WmtsLayerResourceLink[] = findChildrenElement(
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
      resourceUrls.push(
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
      resourceUrls,
      matrixSets,
      defaultStyle,
      ...(latLonBoundingBox && { latLonBoundingBox }),
      ...(dimensions && { dimensions }),
    } as WmtsLayer;
  });
}
