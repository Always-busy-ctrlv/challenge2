const base = require('../../jest.config.base.cjs');

module.exports = {
  ...base,
  displayName: 'shared-validation',
  rootDir: '.',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.json' }],
  },
};
