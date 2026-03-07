module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  testTimeout: 60000,
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  // runInBand is set in npm test script so only one MongoMemoryServer runs at a time.
  watchman: false,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/__tests__/**',
    '!src/scripts/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [['cobertura', { file: 'cobertura.xml' }], 'text'],
};
