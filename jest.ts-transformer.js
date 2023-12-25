const path = require('path');
const tsJest = require('ts-jest').default;

module.exports = {
  // this transformer applies ts-jest but also makes sure
  // that Worker constructors get the full path
  process(src, filename, options) {
    const dir = path.dirname(filename);
    const transformed = src.replace(
      /new Worker\(new URL\(['"](.+)['"], import\.meta\.url\)/,
      `new Worker('${dir}/$1'`
    );
    return tsJest
      .createTransformer(options.transformerConfig)
      .process(transformed, filename, options);
  },
};
