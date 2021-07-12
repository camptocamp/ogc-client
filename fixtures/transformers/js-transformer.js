const path = require('path')
const babelJest = require('babel-jest');
const createCacheKey = require('@jest/create-cache-key-function').default();

module.exports = {
    // this transformer applies babel jest but also makes sure
    // that Worker constructors get the full path
    process(src, filename, options) {
        const dir = path.dirname(filename)
        const transformed = src.replace(/new Worker\(['"](.+)['"]/, `new Worker('${dir}/$1'`);
        return babelJest.process(transformed, filename, options);
    },
    getCacheKey(src, path, config, options) {
        return createCacheKey(src, path, config, options);
    }
};
