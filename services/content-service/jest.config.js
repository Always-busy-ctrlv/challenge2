const base = require('../../jest.config.base.js');

module.exports = {
  ...base,
  displayName: 'content-service',
  rootDir: '.',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.json' }],
  },
};
