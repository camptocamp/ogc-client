// eslint-disable-next-line @typescript-eslint/no-var-requires
const defaultConfig = require('./jest.config.cjs');

module.exports = {
  ...defaultConfig,
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./test-setup.node.ts'],
  transform: {
    ...defaultConfig.transform,
    '\\.c?js$': ['babel-jest'],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(node-fetch|data-uri-to-buffer|fetch-blob|formdata-polyfill)/)',
  ],
};
