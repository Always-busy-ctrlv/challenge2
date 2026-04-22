const base = require('../../jest.config.base.js');

module.exports = {
  ...base,
  displayName: 'api-gateway',
  rootDir: '.',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.json' }],
  },
};
