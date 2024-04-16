import API from './data/api.js';

export function formatClassToString(classObj) {
  return classObj.name;
}

export function formatFunctionToString(functionObj) {
  const params = (functionObj?.signatures?.[0]?.parameters || [])
    .map(
      (param) =>
        `${param.flags?.isRest ? '...' : ''}${param.name}${
          param.flags?.optional ? '?' : ''
        }: ${formatTypeToString(param.type)}`
    )
    .join(', ');
  let typeParams = '';
  if (functionObj?.signatures?.[0]?.typeParameter?.length) {
    typeParams = `&lt;${functionObj.signatures[0].typeParameter
      .map((t) => t.name)
      .join(', ')}&gt;`;
  }
  return `${functionObj.name}${typeParams}(${params})`;
}

export function formatConstructorToString(classObj, functionObj) {
  const params = (functionObj?.signatures?.[0]?.parameters || [])
    .map(
      (param) =>
        `${param.flags?.isRest ? '...' : ''}${param.name}: ${formatTypeToString(
          param.type
        )}`
    )
    .join(', ');
  return `new ${classObj.name}(${params})`;
}

export function formatTypeToString(typeObj) {
  if (!typeObj) return 'void';
  if (typeObj.type === 'array') {
    return `${formatTypeToString(typeObj.elementType)}[]`;
  }
  if (typeObj.type === 'union') {
    return typeObj.types.map(formatTypeToString).join(' | ');
  }
  if (typeObj.type === 'intersection') {
    return typeObj.types.map(formatTypeToString).join(' & ');
  }
  if (typeObj.type === 'literal') {
    return `'${typeObj.value}'`;
  }
  if (
    typeObj.type === 'reflection' &&
    typeObj.declaration?.signatures?.length
  ) {
    const returnType = typeObj.declaration?.signatures?.[0]?.type;
    return `() => ${formatTypeToString(returnType)}`;
  }
  if (typeObj.type === 'reference') {
    switch (typeObj.name) {
      case 'Record':
        return `Record\\<${formatTypeToString(
          typeObj.typeArguments[0]
        )}, ${formatTypeToString(typeObj.typeArguments[1])}\\>`;
      case 'Response':
        return `[Response](https://developer.mozilla.org/en-US/docs/Web/API/Response)`;
      case 'Promise':
        return `Promise&lt;${formatTypeToString(typeObj.typeArguments[0])}&gt;`;
    }
    const ref = API.children.find((el) => el.id === typeObj.target);
    if (ref) {
      return `[${ref.name}](#/api/${ref.name})`;
    }
    return typeObj.name;
  }
  if (typeObj.type === 'query') {
    const ref = API.children.find((el) => el.id === typeObj.queryType.target);
    if (ref) {
      return ref;
    }
    return typeObj.queryType.name;
  }
  if (typeObj.type === 'indexedAccess') {
    return `${formatTypeToString(typeObj.objectType)}[${formatTypeToString(
      typeObj.indexType
    )}]`;
  }
  if (typeObj.type === 'tuple') {
    return `[${typeObj.elements.map(formatTypeToString).join(', ')}]`;
  }
  return typeObj.name;
}

export function getDescription(obj) {
  return (
    obj?.getSignature?.comment?.summary ||
    obj?.signatures?.[0]?.comment?.summary ||
    obj?.comment?.summary
  )
    ?.map((s) => s.text)
    .join('');
}
