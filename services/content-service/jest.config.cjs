const base = require('../../jest.config.base.cjs');

module.exports = {
  ...base,
  displayName: 'content-service',
  rootDir: '.',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.json' }],
  },
};
