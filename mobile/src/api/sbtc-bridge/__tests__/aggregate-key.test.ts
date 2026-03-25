import { normalizeAggregateKey } from "../aggregate-key";

describe("normalizeAggregateKey", () => {
  it("strips the 0x prefix from a bare 32-byte x-only key", () => {
    const key = `0x${"ab".repeat(32)}`;

    expect(normalizeAggregateKey(key)).toBe("ab".repeat(32));
  });

  it("strips the 0x and 02 prefix from a compressed key, returning x-only", () => {
    const key = `0x02${"ab".repeat(32)}`;

    expect(normalizeAggregateKey(key)).toBe("ab".repeat(32));
  });

  it("strips the 0x and 03 prefix from a compressed key, returning x-only", () => {
    const key = `0x03${"ab".repeat(32)}`;

    expect(normalizeAggregateKey(key)).toBe("ab".repeat(32));
  });

  it("rejects an uninitialized short aggregate key", () => {
    expect(() => normalizeAggregateKey("00")).toThrow(
      "Deposits are temporarily unavailable",
    );
  });

  it("rejects invalid aggregate key encodings (uncompressed 04 prefix)", () => {
    expect(() => normalizeAggregateKey(`0x04${"ab".repeat(32)}`)).toThrow(
      "Deposits are temporarily unavailable",
    );
  });
});
