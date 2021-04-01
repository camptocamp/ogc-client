const createCacheKey = require('@jest/create-cache-key-function').default();

module.exports = {
    process(src, path) {
        return 'module.exports = `' + src.replace(/`/g, "\\`") + '`';
    },
    getCacheKey(src, path, config, options) {
        return createCacheKey(src, path, config, options);
    }
};
