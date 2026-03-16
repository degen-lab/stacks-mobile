import { HDKey } from "@scure/bip32";
import {
  getBitcoinAddressesFromStacksWallet,
  NetworkType,
} from "@degenlab/stacks-wallet-kit-core";

import { deriveBitcoinWalletPaymentFromRootKey } from "../wallet";
import { validateBitcoinAddress } from "../validation";

describe("bitcoin wallet derivation", () => {
  it("matches the existing wallet-kit p2wpkh derivation for mainnet and testnet", async () => {
    const rootKey = HDKey.fromMasterSeed(new Uint8Array(32).fill(7));
    const expected = await getBitcoinAddressesFromStacksWallet(rootKey, 0);

    const mainnetPayment = deriveBitcoinWalletPaymentFromRootKey(
      rootKey,
      0,
      NetworkType.Mainnet,
    );
    const testnetPayment = deriveBitcoinWalletPaymentFromRootKey(
      rootKey,
      0,
      NetworkType.Testnet,
    );

    expect(mainnetPayment.address).toBe(expected.mainnet);
    expect(testnetPayment.address).toBe(expected.testnet);
    expect(mainnetPayment.derivationPath).toBe("m/84'/0'/0'/0/0");
    expect(testnetPayment.derivationPath).toBe("m/84'/1'/0'/0/0");
  });

  it("validates recipient addresses against the active network", async () => {
    const rootKey = HDKey.fromMasterSeed(new Uint8Array(32).fill(9));
    const expected = await getBitcoinAddressesFromStacksWallet(rootKey, 0);

    expect(validateBitcoinAddress(expected.mainnet, NetworkType.Mainnet)).toBe(
      true,
    );
    expect(validateBitcoinAddress(expected.mainnet, NetworkType.Testnet)).toBe(
      false,
    );
    expect(validateBitcoinAddress(expected.testnet, NetworkType.Testnet)).toBe(
      true,
    );
    expect(validateBitcoinAddress(expected.testnet, NetworkType.Mainnet)).toBe(
      false,
    );
  });
});
