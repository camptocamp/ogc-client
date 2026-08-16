import * as api from './api.json' with { type: 'json' };
import { createMarkdownRenderer } from 'vitepress';
import {
  formatConstructorToString,
  formatFunctionToString,
  formatTypeToString,
  getDescription,
} from './api-utils.js';

const config = globalThis.VITEPRESS_CONFIG;
const md = await createMarkdownRenderer(
  config.srcDir,
  config.markdown,
  config.site.base,
  config.logger,
);

function markdown(input) {
  if (!input) return undefined;
  return md.render(input);
}

function markdownInline(input) {
  if (!input) return undefined;
  return md.renderInline(input);
}

function processClass(apiElement) {
  const constructorElement = apiElement.children.find(
    (item) => item.name === 'constructor',
  );
  const properties = apiElement.children.filter(
    (item) => item.kind & 262144 /* ReflectionKind.Accessor */,
  );
  const methods = apiElement.children.filter(
    (item) => item.kind & 2048 /* ReflectionKind.Method */,
  );

  return {
    name: apiElement.name,
    descriptionHtml: markdown(getDescription(apiElement)),
    importHtml: markdown(`\`\`\`js
import { ${apiElement.name} } from '@camptocamp/ogc-client'
\`\`\``),
    constructorSignature: markdownInline(
      formatConstructorToString(apiElement, constructorElement.value),
    ),
    constructorDescriptionHtml: markdown(getDescription(constructorElement)),
    properties: properties.map((property) => ({
      name: property.name,
      signature: markdownInline(
        `${property.name}: ${formatTypeToString(property.getSignature.type)}`,
      ),
      descriptionHtml: markdown(getDescription(property)),
    })),
    methods: methods.map((method) => ({
      name: method.name,
      signature: markdownInline(
        `${formatFunctionToString(method)}: ${formatTypeToString(method?.signatures?.[0]?.type)}`,
      ),
      descriptionHtml: markdown(getDescription(method)),
    })),
  };
}

function processFunction(apiElement) {
  return {
    name: apiElement.name,
    descriptionHtml: markdown(getDescription(apiElement)),
    importHtml: markdown(`\`\`\`js
import { ${apiElement.name} } from '@camptocamp/ogc-client'
\`\`\``),
    signature: markdownInline(
      `${formatFunctionToString(apiElement)}: ${formatTypeToString(apiElement?.signatures?.[0]?.type)}`,
    ),
  };
}

function processType(apiElement) {
  const isInterface =
    apiElement.kind & 256 /* ReflectionKind.Interface */ ||
    apiElement.kind & 65536 /* ReflectionKind.TypeLiteral */ ||
    (apiElement.kind & 2097152 /* ReflectionKind.TypeAlias */ &&
      apiElement.children?.length > 1);

  const isAlias =
    apiElement.kind & 2097152 /* ReflectionKind.TypeAlias */ && !isInterface;

  const properties = apiElement.children?.filter(
    (item) => item.kind & 1024 /* ReflectionKind.Property */,
  );

  return {
    name: apiElement.name,
    descriptionHtml: markdown(getDescription(apiElement)),
    isAlias,
    isInterface,
    alias: isAlias && markdownInline(formatTypeToString(apiElement.type)),
    properties:
      isInterface &&
      properties.map((property) => ({
        name: property.name,
        signature: markdownInline(
          `${property.name}: ${formatTypeToString(property.type)}`,
        ),
        descriptionHtml: markdown(getDescription(property)),
      })),
  };
}

export default {
  async load() {
    return {
      classes: api.children
        .filter((item) => item.kind & 128 /* ReflectionKind.Class */)
        .map(processClass),
      functions: api.children
        .filter((item) => item.kind & 64 /* ReflectionKind.Function */)
        .map(processFunction),
      types: api.children
        .filter(
          (item) =>
            item.kind & 256 /* ReflectionKind.Interface */ ||
            item.kind & 2097152 /* ReflectionKind.TypeAlias */,
        )
        .map(processType),
    };
  },
};
