module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|xml)$': [
      '<rootDir>/jest.ts-transformer.js',
      {
        isolatedModules: true,
        stringifyContentPathRegex: '.(xml)$',
      },
    ],
  },
  setupFilesAfterEnv: ['./test-setup.ts'],
  coveragePathIgnorePatterns: ['.(xml)$'],
};