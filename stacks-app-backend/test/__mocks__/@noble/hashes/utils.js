module.exports = {
  hexToBytes: jest.fn((hex) => new Uint8Array(hex.length / 2)),
};
