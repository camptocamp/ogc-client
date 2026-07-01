import { XmlDocument, XmlElement } from '@rgrove/parse-xml';
import { check, parse } from '../shared/errors.js';
import {
  findChildElement,
  findChildrenElement,
  getChildrenElement,
  getElementAttribute,
  getElementName,
  getElementText,
  getRootElement,
  stripNamespace,
} from '../shared/xml-utils.js';
import {
  WpsExecuteOptions,
  WpsExecuteOutputResult,
  WpsExecuteResponse,
  WpsExecuteStatus,
  WpsInputValue,
  WpsProcessFull,
  WpsVersion,
} from './model.js';

const escapeXml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
      }[c]!)
  );

/** Build an element; attribute values are escaped here so it can't be forgotten. */
const el = (
  tag: string,
  attrs: Record<string, string | undefined>,
  children = ''
) => {
  const a = Object.entries(attrs)
    .filter(([, v]) => v != null)
    .map(([k, v]) => ` ${k}="${escapeXml(v!)}"`)
    .join('');
  return children === '' ? `<${tag}${a}/>` : `<${tag}${a}>${children}</${tag}>`;
};

/** Build a text element; text content is escaped here. */
const text = (tag: string, value: string) => el(tag, {}, escapeXml(value));

const cdata = (raw: string) =>
  `<![CDATA[${raw.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;

/**
 * Complex content is XML embedded in XML when the mimeType denotes GML/XML (raw
 * insertion), otherwise it is wrapped in CDATA so any `<` or `&` survives.
 */
function complexBody(mimeType: string, content: string): string {
  return /xml|gml/i.test(mimeType) ? content : cdata(content);
}

function buildInput(value: WpsInputValue): string {
  const identifier = text('ows:Identifier', value.identifier);

  if (value.literalValue !== undefined) {
    return el(
      'wps:Input',
      {},
      identifier +
        el('wps:Data', {}, text('wps:LiteralData', value.literalValue))
    );
  }

  if (value.boundingBoxValue) {
    const { crs, bbox } = value.boundingBoxValue;
    const [minx, miny, maxx, maxy] = bbox;
    return el(
      'wps:Input',
      {},
      identifier +
        el(
          'wps:Data',
          {},
          el(
            'wps:BoundingBoxData',
            { crs, dimensions: '2' },
            text('ows:LowerCorner', `${minx} ${miny}`) +
              text('ows:UpperCorner', `${maxx} ${maxy}`)
          )
        )
    );
  }

  const { mimeType, content } = value.complexValue!;
  return el(
    'wps:Input',
    {},
    identifier +
      el(
        'wps:Data',
        {},
        el('wps:ComplexData', { mimeType }, complexBody(mimeType, content))
      )
  );
}

/**
 * Builds a WPS Execute request body (POST XML) for the given process.
 * @param process The full process description (used to type/validate inputs)
 * @param options Execution options (inputs, outputs, response form flags)
 * @param version The WPS version to declare in the request
 */
export function buildExecuteRequest(
  process: WpsProcessFull,
  options: WpsExecuteOptions,
  version: WpsVersion
): string {
  const inputs = options.inputs.map(buildInput).join('');

  const responseForm = el(
    'wps:ResponseForm',
    {},
    el(
      'wps:ResponseDocument',
      {
        storeExecuteResponse: String(options.storeExecuteResponse ?? false),
        lineage: String(options.lineage ?? false),
        status: String(options.status ?? false),
      },
      options.outputs
        .map((output) =>
          el(
            'wps:Output',
            {
              asReference: String(output.asReference ?? false),
              mimeType: output.mimeType,
            },
            text('ows:Identifier', output.identifier)
          )
        )
        .join('')
    )
  );

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    el(
      'wps:Execute',
      {
        service: 'WPS',
        version,
        'xmlns:wps': 'http://www.opengis.net/wps/1.0.0',
        'xmlns:ows': 'http://www.opengis.net/ows/1.1',
        'xmlns:xlink': 'http://www.w3.org/1999/xlink',
      },
      text('ows:Identifier', process.identifier) +
        el('wps:DataInputs', {}, inputs) +
        responseForm
    )
  );
}

const STATUS_TAG_MAP: Record<string, WpsExecuteStatus> = {
  ProcessAccepted: 'accepted',
  ProcessStarted: 'started',
  ProcessPaused: 'paused',
  ProcessSucceeded: 'succeeded',
  ProcessFailed: 'failed',
};

/**
 * Parses a WPS ExecuteResponse document.
 * @throws {ServiceExceptionError} on an OWS exception report (at the root, or
 *   nested inside a ProcessFailed status returned with HTTP 200)
 */
export function parseExecuteResponse(
  executeDoc: XmlDocument
): WpsExecuteResponse {
  // ExceptionReport at the root (e.g. malformed request, 4xx)
  check(executeDoc);

  const root = getRootElement(executeDoc);
  const statusLocation = getElementAttribute(root, 'statusLocation');

  const statusEl = findChildElement(root, 'Status');
  const statusChild = getChildrenElement(statusEl).find(
    (child) => stripNamespace(getElementName(child)) in STATUS_TAG_MAP
  );
  const statusName = statusChild
    ? stripNamespace(getElementName(statusChild))
    : '';
  const status = STATUS_TAG_MAP[statusName] ?? 'accepted';

  // In WPS 1.0.0 a failure is delivered as HTTP 200 with an ExceptionReport
  // nested inside ProcessFailed; check() at the root does not see it.
  if (status === 'failed' && statusChild) {
    const exception = findChildElement(statusChild, 'Exception', true);
    if (exception) throw parse(exception);
  }

  const percentCompletedAttr = getElementAttribute(
    statusChild,
    'percentCompleted'
  );

  const outputs = findChildrenElement(
    findChildElement(root, 'ProcessOutputs'),
    'Output'
  ).map(parseOutputResult);

  return {
    status,
    ...(statusLocation && { statusLocation }),
    ...(percentCompletedAttr && {
      percentCompleted: parseInt(percentCompletedAttr, 10),
    }),
    outputs,
  };
}

function parseOutputResult(outputEl: XmlElement): WpsExecuteOutputResult {
  const identifier = getElementText(findChildElement(outputEl, 'Identifier'));
  const title = getElementText(findChildElement(outputEl, 'Title'));

  const referenceEl = findChildElement(outputEl, 'Reference');
  if (referenceEl) {
    const mimeType = getElementAttribute(referenceEl, 'mimeType');
    return {
      identifier,
      ...(title && { title }),
      reference: {
        href: getElementAttribute(referenceEl, 'xlink:href'),
        ...(mimeType && { mimeType }),
      },
    };
  }

  const dataEl = findChildElement(outputEl, 'Data');
  const inner = getChildrenElement(dataEl)[0] ?? null;
  const mimeType = getElementAttribute(inner, 'mimeType');
  return {
    identifier,
    ...(title && { title }),
    data: {
      ...(mimeType && { mimeType }),
      content: getElementText(inner),
    },
  };
}
