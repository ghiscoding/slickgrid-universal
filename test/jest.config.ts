import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  rootDir: '../',
  globalSetup: '<rootDir>/test/jest-global-setup.ts',
  cacheDirectory: '<rootDir>/test/.jest-cache',
  collectCoverage: false,
  collectCoverageFrom: [
    'packages/**/*.ts',
    '!**/dist/**',
    '!src/assets/**',
    '!examples/vite-demo-vanilla-bundle/**',
    '!**/node_modules/**',
    '!**/test/**',
    '!**/enums.index.ts',
    '!**/index.ts',
  ],
  coverageDirectory: '<rootDir>/test/jest-coverage',
  coveragePathIgnorePatterns: [
    '\\.d\\.ts$',
    'global-grid-options.ts',
    'salesforce-global-grid-options.ts',
    'vite.config.ts',
    '<rootDir>/node_modules/'
  ],
  coverageReporters: [
    'json',
    'lcov',
    'text',
    'html'
  ],
  moduleFileExtensions: [
    'json',
    'js',
    'ts'
  ],
  modulePaths: [
    'src',
    '<rootDir>/node_modules'
  ],
  preset: 'ts-jest',
  setupFiles: ['<rootDir>/test/jest-pretest.ts'],
  setupFilesAfterEnv: ['jest-extended/all', '<rootDir>/test/jest-global-mocks.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        diagnostics: false,
        isolatedModules: true,
        tsconfig: '<rootDir>/test/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.html$'
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@slickgrid-universal)/)',
  ],
  testMatch: [
    '**/__tests__/**/*.+(ts|js)',
    '**/+(*.)+(spec|test).+(ts|js)'
  ],
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '<rootDir>/test/cypress/',
    '<rootDir>/node_modules/',
  ],
};

export default config;