// Integration test setup - disable all mocks
// Integration tests should use real implementations, not mocks

// Unmock all modules - integration tests should test the real code
// Note: transaction.test.ts needs mocks for @noble/hashes and @noble/secp256k1
// because Jest can't handle ES modules, so we skip unmocking them for that test
// eslint-disable-next-line no-undef
const testFile = expect?.getState?.()?.testPath || '';
if (!testFile.includes('transaction.test.ts')) {
  // eslint-disable-next-line no-undef
  jest.unmock('@noble/hashes/utils');
  // eslint-disable-next-line no-undef
  jest.unmock('@noble/hashes/utils.js');
  // eslint-disable-next-line no-undef
  jest.unmock('@noble/secp256k1');
}

// Disable automatic mocking
// eslint-disable-next-line no-undef
jest.doMock = jest.fn();
