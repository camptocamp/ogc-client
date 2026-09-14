import * as api from './data/api.json' with { type: 'json' };
import { createMarkdownRenderer } from 'vitepress';
import {
  formatConstructorToString,
  formatFunctionToString,
  formatTypeToString,
  getDescription,
  getReturnDescription,
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

function processClass(apiElement, importPath) {
  const constructorElement = apiElement.children.find(
    (item) => item.name === 'constructor',
  );
  const properties = apiElement.children.filter(
    (item) =>
      (item.kind & 262144 /* ReflectionKind.Accessor */ ||
        item.kind & 1024) /* ReflectionKind.Property */ &&
      !item.flags?.isInherited,
  );
  const methods = apiElement.children.filter(
    (item) =>
      item.kind & 2048 /* ReflectionKind.Method */ &&
      !item.flags?.isInherited &&
      !item.flags?.isStatic,
  );
  const staticMethods = apiElement.children
    .filter(
      (item) =>
        item.kind & 2048 /* ReflectionKind.Method */ &&
        !item.flags?.isInherited &&
        item.flags?.isStatic,
    )
    .map((methodElement) => ({
      ...methodElement,
      name: `${apiElement.name}.${methodElement.name}`,
    }));

  return {
    name: apiElement.name,
    descriptionHtml: markdown(getDescription(apiElement)),
    importHtml: markdown(`\`\`\`js
import { ${apiElement.name} } from '${importPath}'
\`\`\``),
    constructorSignature: constructorElement
      ? markdownInline(
          formatConstructorToString(apiElement, constructorElement),
        )
      : null,
    constructor: constructorElement
      ? processFunction(constructorElement, importPath)
      : null,
    constructorDescriptionHtml: constructorElement
      ? markdown(getDescription(constructorElement))
      : null,
    properties: properties.map((property) => ({
      name: property.name,
      signature: markdownInline(
        formatTypeToString(property.getSignature?.type ?? property.type),
      ),
      descriptionHtml: markdown(getDescription(property)),
    })),
    methods: methods.map((method) => processFunction(method, importPath)),
    staticMethods: staticMethods.map((method) =>
      processFunction(method, importPath),
    ),
    extends: apiElement.extendedTypes?.map((extended) => ({
      signature: markdownInline(formatTypeToString(extended)),
    })),
  };
}

function processFunction(apiElement, importPath) {
  const signature = apiElement.signatures?.[0];

  return {
    name: apiElement.name,
    descriptionHtml: markdown(getDescription(apiElement)),
    importHtml: markdown(`\`\`\`js
import { ${apiElement.name} } from '${importPath}'
\`\`\``),
    signature: markdownInline(
      `${formatFunctionToString(apiElement)}: ${formatTypeToString(signature?.type)}`,
    ),
    parameters: apiElement.signatures?.[0].parameters?.map((param) => ({
      name: param.name,
      signature: markdownInline(formatTypeToString(param.type)),
      descriptionHtml: markdown(getDescription(param)),
    })),
    returns: markdownInline(formatTypeToString(signature?.type)),
    returnsDescriptionHtml: markdown(getReturnDescription(apiElement)),
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
        signature: markdownInline(formatTypeToString(property.type)),
        descriptionHtml: markdown(getDescription(property)),
      })),
  };
}

export default {
  async load() {
    const apiModules = [
      {
        module: api.children.find((item) => item.name === 'index'),
        importPath: '@camptocamp/ogc-client',
      },
      {
        module: api.children.find((item) => item.name === 'csapi'),
        importPath: '@camptocamp/ogc-client/csapi',
      },
    ];

    return {
      classes: apiModules
        .flatMap(({ module, importPath }) =>
          module.children
            .filter((item) => item.kind & 128 /* ReflectionKind.Class */)
            .map((item) => processClass(item, importPath)),
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
      functions: apiModules
        .flatMap(({ module, importPath }) =>
          module.children
            .filter((item) => item.kind & 64 /* ReflectionKind.Function */)
            .map((item) => processFunction(item, importPath)),
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
      types: apiModules
        .flatMap(({ module }) =>
          module.children
            .filter(
              (item) =>
                item.kind & 256 /* ReflectionKind.Interface */ ||
                item.kind & 2097152 /* ReflectionKind.TypeAlias */,
            )
            .map(processType),
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  },
};
