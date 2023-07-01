const WorkerPlugin = require('worker-plugin');
module.exports = {
  configureWebpack: {
    output: {
      globalObject: 'this',
      hashFunction: 'xxhash64', // avoids error ERR_OSSL_EVP_UNSUPPORTED
    },
    plugins: [new WorkerPlugin()],
  },
  publicPath: './',
};
