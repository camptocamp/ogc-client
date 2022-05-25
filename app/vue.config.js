const WorkerPlugin = require('worker-plugin');
module.exports = {
  configureWebpack: {
    output: {
      globalObject: 'this',
    },
    plugins: [new WorkerPlugin()],
  },
  publicPath: './',
};
