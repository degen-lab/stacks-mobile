import { parseWalletRedirectionPayload } from "../utils/wallet-redirection";

describe("parseWalletRedirectionPayload", () => {
  it("extracts a valid Transak wallet redirection payload", () => {
    expect(
      parseWalletRedirectionPayload({
        walletAddress: "tb1qexampledestination0000000000000000000000000",
        cryptoAmount: 0.1234,
        cryptoCurrency: "BTC",
      }),
    ).toEqual({
      walletAddress: "tb1qexampledestination0000000000000000000000000",
      cryptoAmount: "0.1234",
      cryptoCurrency: "BTC",
      network: undefined,
    });
  });

  it("returns null when required fields are missing", () => {
    expect(parseWalletRedirectionPayload({ cryptoAmount: 0.1 })).toBeNull();
    expect(
      parseWalletRedirectionPayload({ walletAddress: "tb1q..." }),
    ).toBeNull();
  });
});
