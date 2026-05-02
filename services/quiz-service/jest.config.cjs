const base = require('../../jest.config.base.cjs');

module.exports = {
  ...base,
  displayName: 'quiz-service',
  rootDir: '.',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.json' }],
  },
};
