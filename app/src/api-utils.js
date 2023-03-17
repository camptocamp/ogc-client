export function formatClassToString(classObj) {
  return classObj.name;
}

export function formatFunctionToString(functionObj) {
  const params = functionObj.params
    .map(
      (param) =>
        `${param.name}${param.optional ? '?' : ''}: ${formatTypeToString(
          param
        )}`
    )
    .join(', ');
  return `${functionObj.name}(${params})`;
}

export function formatConstructorToString(classObj) {
  const params = classObj.constructor.params
    .map((param) => `${param.name}: ${formatTypeToString(param)}`)
    .join(', ');
  return `new ${classObj.name}(${params})`;
}

export function formatTypeToString(typeObj) {
  if (!typeObj) return 'void';
  const subType = typeObj.subType ? formatTypeToString(typeObj.subType) : '';
  switch (typeObj.type || typeObj) {
    case 'Array':
      return `${subType}[]`;
    case 'Response':
      return `[Response](https://developer.mozilla.org/en-US/docs/Web/API/Response)`;
    case 'Promise':
      return `[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;${subType}&gt;`;
    case 'AsyncFunction':
      return `async () => ${subType}`;
    case 'string':
      if (typeObj.values) return typeObj.values.map((v) => `'${v}`).join(' | ');
  }
  return typeObj.type || typeObj;
}
