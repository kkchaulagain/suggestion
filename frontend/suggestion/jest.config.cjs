module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['**/src/__tests__/**/*.test.ts?(x)'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/__tests__/**',
    '!vite.config.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [['cobertura', { file: 'cobertura.xml' }], 'text'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        sourceMaps: 'inline',
        module: {
          type: 'es6',
        },
        jsc: {
          target: 'es2022',
          parser: {
            syntax: 'typescript',
            tsx: true,
          },
          transform: {
            react: {
              runtime: 'automatic',
            },
          },
        },
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  watchman: false,
}
