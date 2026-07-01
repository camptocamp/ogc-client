import { XmlDocument, XmlElement } from '@rgrove/parse-xml';
import {
  findChildElement,
  findChildrenElement,
  getElementAttribute,
  getElementText,
  getRootElement,
} from '../shared/xml-utils.js';
import {
  WpsComplexData,
  WpsFormat,
  WpsProcessFull,
  WpsProcessInput,
  WpsProcessOutput,
} from './model.js';

/**
 * Parses a WPS DescribeProcess response and returns the full description of the
 * requested process.
 * @param describeProcessDoc The parsed XML document from a DescribeProcess response
 * @param processId The process identifier to look for in the response
 * @return The full process description, or null if the process was not found
 */
export function parseDescribeProcessResponse(
  describeProcessDoc: XmlDocument,
  processId: string
): WpsProcessFull | null {
  const root = getRootElement(describeProcessDoc);
  const descriptions = findChildrenElement(root, 'ProcessDescription');
  const match =
    descriptions.find(
      (el) => getElementText(findChildElement(el, 'Identifier')) === processId
    ) ?? null;
  if (!match) return null;

  const abstract = getElementText(findChildElement(match, 'Abstract'));
  const processVersion = getElementAttribute(match, 'wps:processVersion');

  const dataInputs = findChildElement(match, 'DataInputs');
  const inputs = findChildrenElement(dataInputs, 'Input').map(parseInput);

  const processOutputs = findChildElement(match, 'ProcessOutputs');
  const outputs = findChildrenElement(processOutputs, 'Output').map(
    parseOutput
  );

  return {
    identifier: getElementText(findChildElement(match, 'Identifier')),
    title: getElementText(findChildElement(match, 'Title')),
    ...(abstract && { abstract }),
    ...(processVersion && { processVersion }),
    statusSupported: getElementAttribute(match, 'statusSupported') === 'true',
    storeSupported: getElementAttribute(match, 'storeSupported') === 'true',
    inputs,
    outputs,
  };
}

function parseOccurs(value: string, fallback: number): number {
  if (value === '') return fallback;
  if (value.toLowerCase() === 'unbounded') return Infinity;
  return parseInt(value, 10);
}

function parseFormat(formatEl: XmlElement): WpsFormat {
  const encoding = getElementText(findChildElement(formatEl, 'Encoding'));
  const schema = getElementText(findChildElement(formatEl, 'Schema'));
  return {
    mimeType: getElementText(findChildElement(formatEl, 'MimeType')),
    ...(encoding && { encoding }),
    ...(schema && { schema }),
  };
}

function parseComplexData(el: XmlElement): WpsComplexData {
  const defaultFormat = findChildElement(
    findChildElement(el, 'Default'),
    'Format'
  );
  const supported = findChildrenElement(
    findChildElement(el, 'Supported'),
    'Format'
  ).map(parseFormat);
  const maximumMegabytes = getElementAttribute(el, 'maximumMegabytes');
  return {
    default: defaultFormat ? parseFormat(defaultFormat) : { mimeType: '' },
    supported,
    ...(maximumMegabytes && {
      maximumMegabytes: parseInt(maximumMegabytes, 10),
    }),
  };
}

function parseInput(inputEl: XmlElement): WpsProcessInput {
  const title = getElementText(findChildElement(inputEl, 'Title'));
  const abstract = getElementText(findChildElement(inputEl, 'Abstract'));
  const base = {
    identifier: getElementText(findChildElement(inputEl, 'Identifier')),
    ...(title && { title }),
    ...(abstract && { abstract }),
    minOccurs: parseOccurs(getElementAttribute(inputEl, 'minOccurs'), 0),
    maxOccurs: parseOccurs(getElementAttribute(inputEl, 'maxOccurs'), 1),
  };

  const literalEl = findChildElement(inputEl, 'LiteralData');
  if (literalEl) {
    const dataType = getElementText(findChildElement(literalEl, 'DataType'));
    const defaultValue = getElementText(
      findChildElement(literalEl, 'DefaultValue')
    );
    const allowedValues = findChildrenElement(
      findChildElement(literalEl, 'AllowedValues'),
      'Value'
    ).map(getElementText);
    const anyValue = !!findChildElement(literalEl, 'AnyValue');
    return {
      ...base,
      type: 'literal',
      literalData: {
        ...(dataType && { dataType }),
        ...(defaultValue && { defaultValue }),
        ...(allowedValues.length && { allowedValues }),
        ...(anyValue && { anyValue }),
      },
    };
  }

  const bboxEl = findChildElement(inputEl, 'BoundingBoxData');
  if (bboxEl) {
    return {
      ...base,
      type: 'boundingbox',
      boundingBoxData: {
        defaultCrs: getElementText(
          findChildElement(findChildElement(bboxEl, 'Default'), 'CRS')
        ),
        supportedCrs: findChildrenElement(
          findChildElement(bboxEl, 'Supported'),
          'CRS'
        ).map(getElementText),
      },
    };
  }

  const complexEl = findChildElement(inputEl, 'ComplexData');
  return {
    ...base,
    type: 'complex',
    complexData: parseComplexData(complexEl),
  };
}

function parseOutput(outputEl: XmlElement): WpsProcessOutput {
  const title = getElementText(findChildElement(outputEl, 'Title'));
  const abstract = getElementText(findChildElement(outputEl, 'Abstract'));
  const base = {
    identifier: getElementText(findChildElement(outputEl, 'Identifier')),
    ...(title && { title }),
    ...(abstract && { abstract }),
  };

  const literalEl = findChildElement(outputEl, 'LiteralOutput');
  if (literalEl) {
    const dataType = getElementText(findChildElement(literalEl, 'DataType'));
    return {
      ...base,
      type: 'literal',
      ...(dataType && { literalData: { dataType } }),
    };
  }

  const bboxEl = findChildElement(outputEl, 'BoundingBoxOutput');
  if (bboxEl) {
    return { ...base, type: 'boundingbox' };
  }

  const complexEl = findChildElement(outputEl, 'ComplexOutput');
  return {
    ...base,
    type: 'complex',
    complexData: parseComplexData(complexEl),
  };
}
