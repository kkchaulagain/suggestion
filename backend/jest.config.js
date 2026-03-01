module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  testTimeout: 60000,
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  watchman: false,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [['cobertura', { file: 'cobertura.xml' }], 'text'],
};
