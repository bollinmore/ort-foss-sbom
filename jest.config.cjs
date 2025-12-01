/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@models$': '<rootDir>/src/models/index.ts',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@cli/(.*)$': '<rootDir>/src/cli/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1'
  },
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: 'coverage'
};
