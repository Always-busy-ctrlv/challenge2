const path = require('path');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  forceExit: true,
  moduleNameMapper: {
    '^@elect-ed/shared-utils/middleware\\.js$': path.resolve(__dirname, './packages/shared-utils/src/middleware'),
    '^@elect-ed/(.*)$': path.resolve(__dirname, './packages/$1/src'),
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 99.5,
      functions: 99.5,
      lines: 99.5,
      statements: 99.5,
    },
  },
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.base.json' }],
  },
};
