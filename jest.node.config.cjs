const defaultConfig = require('./jest.config.cjs');

module.exports = {
  ...defaultConfig,
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./test-setup.node.ts'],
  transform: {
    ...defaultConfig.transform,
    '\\.c?js$': ['babel-jest'],
  },
};
