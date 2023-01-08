module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|ts|xml)$': [
      '<rootDir>/jest.ts-transformer.js',
      {
        isolatedModules: true,
        stringifyContentPathRegex: '\\.(xml)$',
      },
    ],
  },
  setupFilesAfterEnv: ['./test-setup.ts'],
};
