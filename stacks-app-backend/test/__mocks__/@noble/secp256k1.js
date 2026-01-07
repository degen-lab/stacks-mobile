module.exports = {
  signAsync: jest.fn(async () => ({
    r: BigInt(1),
    s: BigInt(1),
    recovery: 0,
  })),
  getPublicKey: jest.fn(() => new Uint8Array(33)),
  verify: jest.fn(() => true),
  utils: {},
};
