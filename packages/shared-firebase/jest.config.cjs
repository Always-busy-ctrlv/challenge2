const base = require('../../jest.config.base.cjs');

module.exports = {
  ...base,
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
};
