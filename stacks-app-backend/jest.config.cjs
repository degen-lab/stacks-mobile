/** @type {import('ts-jest').JestConfigWithTsJest} **/
// Skip integration tests in CI (no PostgreSQL/Redis available)
const isCI = process.env.CI === 'true' || process.env.CI === '1';
const testMatch = isCI
  ? ['**/test/unit/**/*.test.ts'] // Only unit tests in CI
  : ['**/test/**/*.test.ts']; // All tests locally

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          rootDir: '.',
          baseUrl: '.',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },

  transformIgnorePatterns: ['/node_modules/(?!@noble/secp256k1|@noble/hashes)'],
  extensionsToTreatAsEsm: ['.ts'],
  modulePathIgnorePatterns: ['/dist'],
  forceExit: true,

  detectOpenHandles: true,
  testTimeout: 120000, // 2 minutes timeout
  silent: false, // Set to true to suppress all console output
  verbose: false, // Set to true for more detailed test output
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
};
