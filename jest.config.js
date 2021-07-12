module.exports = {
  transform: {
    '^.+\\.js$': '<rootDir>/fixtures/transformers/js-transformer.js',
    '^.+\\.xml$': '<rootDir>/fixtures/transformers/xml-transformer.js',
  },
  setupFilesAfterEnv: ['./test-setup.js'],
};
