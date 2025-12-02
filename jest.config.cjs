/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 60000,
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@models$': '<rootDir>/src/models/index.ts',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@cli/(.*)$': '<rootDir>/src/cli/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@fixtures/(.*)$': '<rootDir>/tests/fixtures/$1'
  },
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: 'coverage'
};
