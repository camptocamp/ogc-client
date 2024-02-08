const path = require('path');
const tsJest = require('ts-jest').default;

module.exports = {
  // this transformer applies ts-jest but also makes sure
  // that the Worker constructor get the full path
  process(src, filename, options) {
    const dir = path.dirname(filename);
    const transformed = src
      .replace(
        /new OgcClientWorker\(\)/,
        `new Worker('${dir}/worker.ts', { type: 'module' })`
      )
      .replace(`import OgcClientWorker from './worker?worker&inline';`, '');
    return tsJest
      .createTransformer(options.transformerConfig)
      .process(transformed, filename, options);
  },
};
