module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  testTimeout: 60000,
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  watchman: false,
};
