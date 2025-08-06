module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|xml)$': [
      '<rootDir>/jest.ts-transformer.cjs',
      {
        isolatedModules: true,
        stringifyContentPathRegex: '.(xml)$',
      },
    ],
  },
  setupFilesAfterEnv: ['./test-setup.ts'],
  coveragePathIgnorePatterns: ['.(xml)$'],
  // this is required because imports end in ".js"
  moduleNameMapper: {
    '^(..?/.+)\\.c?jsx?$': '$1',
  },
};
