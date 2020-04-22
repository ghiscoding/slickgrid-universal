module.exports = {
  rootDir: '../',
  globals: {
    'ts-jest': {
      diagnostics: false,
      isolatedModules: true,
      tsConfig: '<rootDir>/test/tsconfig.spec.json'
    },
  },
  collectCoverage: false,
  collectCoverageFrom: [
    'packages/**/*.ts',
    '!**/dist/**',
    '!src/assets/**',
    '!packages/web-demo-vanilla-bundle/**',
    '!**/node_modules/**',
    '!**/test/**',
  ],
  coverageDirectory: '<rootDir>/test/jest-coverage',
  coveragePathIgnorePatterns: [
    '\\.d\\.ts$',
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
  setupFilesAfterEnv: ['jest-extended', '<rootDir>/test/jest-global-mocks.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@slickgrid-universal)/)',
    '<rootDir>/node_modules/slickgrid/'
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
