import { describe, expect, it } from "vitest";
import { Cl, ClarityType, BufferCV } from "@stacks/transactions";
import * as secp from "@noble/secp256k1";
import { hexToBytes } from "@noble/hashes/utils";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

// Server private key (matches SERVER-PUBKEY in contract)
// Public key: 0x0216f4507093a2222385a1a55ad48f9ee3a398bc8fe3ef42dcd06a81e82c1fb900
const TEST_PRIVATE_KEY = hexToBytes(
  "9d1c335cbb06fd64865780d355e3784c29746a58c3f116027be0ad27cd2530dc"
);

/**
 * Get message hash directly from contract (most reliable)
 */
function getContractMessageHash(
  principal: string,
  score: number | bigint,
  nonce: number | bigint
): Uint8Array {
  const { result } = simnet.callReadOnlyFn(
    "signature",
    "make-message-hash",
    [Cl.principal(principal), Cl.uint(score), Cl.uint(nonce)],
    deployer
  );
  if (result.type === ClarityType.Buffer) {
    const buf = (result as BufferCV).value;
    // SDK may return hex string or Uint8Array
    if (typeof buf === "string") {
      return hexToBytes(buf.replace(/^0x/, ""));
    }
    return buf;
  }
  throw new Error("Failed to get message hash from contract");
}

/**
 * Sign a message hash with the test private key
 * Returns a 65-byte recoverable signature for Clarity's secp256k1-verify
 * Format: r (32 bytes) || s (32 bytes) || recovery_id (1 byte)
 */
async function signMessage(messageHash: Uint8Array): Promise<Uint8Array> {
  const signature = await secp.signAsync(messageHash, TEST_PRIVATE_KEY, {
    lowS: true,
  });

  const recoveryId = signature.recovery;
  const r = signature.r.toString(16).padStart(64, "0");
  const s = signature.s.toString(16).padStart(64, "0");
  // Recovery byte at end (r || s || v format)
  const v = recoveryId.toString(16).padStart(2, "0");

  return hexToBytes(r + s + v);
}

/**
 * Helper to create a valid signature for submit-score
 * Uses the contract's message hash computation for consistency
 */
async function createValidSignature(
  user: string,
  score: number | bigint,
  nonce: number | bigint
): Promise<Uint8Array> {
  const msgHash = getContractMessageHash(user, score, nonce);
  return signMessage(msgHash);
}

// ============================================
// TESTS
// ============================================

describe("signature contract", () => {
  describe("make-message-hash", () => {
    it("returns consistent hash for same inputs", () => {
      const { result: result1 } = simnet.callReadOnlyFn(
        "signature",
        "make-message-hash",
        [Cl.principal(wallet1), Cl.uint(100), Cl.uint(1)],
        deployer
      );

      const { result: result2 } = simnet.callReadOnlyFn(
        "signature",
        "make-message-hash",
        [Cl.principal(wallet1), Cl.uint(100), Cl.uint(1)],
        deployer
      );

      expect(result1).toStrictEqual(result2);
    });

    it("returns different hash for different users", () => {
      const { result: result1 } = simnet.callReadOnlyFn(
        "signature",
        "make-message-hash",
        [Cl.principal(wallet1), Cl.uint(100), Cl.uint(1)],
        deployer
      );

      const { result: result2 } = simnet.callReadOnlyFn(
        "signature",
        "make-message-hash",
        [Cl.principal(wallet2), Cl.uint(100), Cl.uint(1)],
        deployer
      );

      expect(result1).not.toStrictEqual(result2);
    });

    it("returns different hash for different scores", () => {
      const { result: result1 } = simnet.callReadOnlyFn(
        "signature",
        "make-message-hash",
        [Cl.principal(wallet1), Cl.uint(100), Cl.uint(1)],
        deployer
      );

      const { result: result2 } = simnet.callReadOnlyFn(
        "signature",
        "make-message-hash",
        [Cl.principal(wallet1), Cl.uint(200), Cl.uint(1)],
        deployer
      );

      expect(result1).not.toStrictEqual(result2);
    });

    it("returns different hash for different nonces", () => {
      const { result: result1 } = simnet.callReadOnlyFn(
        "signature",
        "make-message-hash",
        [Cl.principal(wallet1), Cl.uint(100), Cl.uint(1)],
        deployer
      );

      const { result: result2 } = simnet.callReadOnlyFn(
        "signature",
        "make-message-hash",
        [Cl.principal(wallet1), Cl.uint(100), Cl.uint(2)],
        deployer
      );

      expect(result1).not.toStrictEqual(result2);
    });

    it("returns a 32-byte hash", () => {
      const hash = getContractMessageHash(wallet1, 1000, 1);
      expect(hash.length).toBe(32);
    });
  });

  describe("submit-score", () => {
    it("succeeds with valid signature", async () => {
      const score = 1000;
      const nonce = 1;
      const sig = await createValidSignature(wallet1, score, nonce);

      const { result } = simnet.callPublicFn(
        "signature",
        "submit-score",
        [Cl.uint(score), Cl.uint(nonce), Cl.buffer(sig)],
        wallet1
      );

      expect(result).toHaveClarityType(ClarityType.ResponseOk);
    });

    it("stores the score correctly", async () => {
      const score = 2500;
      const nonce = 1;
      const sig = await createValidSignature(wallet2, score, nonce);

      simnet.callPublicFn(
        "signature",
        "submit-score",
        [Cl.uint(score), Cl.uint(nonce), Cl.buffer(sig)],
        wallet2
      );

      // Check the stored score via map
      const userScores = simnet.getMapEntry(
        "signature",
        "user-scores",
        Cl.tuple({ user: Cl.principal(wallet2) })
      );

      expect(userScores).toHaveClarityType(ClarityType.OptionalSome);
      if (userScores.type === ClarityType.OptionalSome) {
        const tuple = userScores.value;
        if (tuple.type === ClarityType.Tuple) {
          expect(tuple.value.score).toBeUint(score);
          expect(tuple.value.nonce).toBeUint(nonce);
        }
      }
    });

    it("allows updating score with higher nonce", async () => {
      const user = accounts.get("wallet_3")!;

      // First submission
      const sig1 = await createValidSignature(user, 500, 1);
      const { result: result1 } = simnet.callPublicFn(
        "signature",
        "submit-score",
        [Cl.uint(500), Cl.uint(1), Cl.buffer(sig1)],
        user
      );
      expect(result1).toHaveClarityType(ClarityType.ResponseOk);

      // Second submission with higher nonce
      const sig2 = await createValidSignature(user, 750, 2);
      const { result: result2 } = simnet.callPublicFn(
        "signature",
        "submit-score",
        [Cl.uint(750), Cl.uint(2), Cl.buffer(sig2)],
        user
      );
      expect(result2).toHaveClarityType(ClarityType.ResponseOk);

      // Verify updated score
      const userScores = simnet.getMapEntry(
        "signature",
        "user-scores",
        Cl.tuple({ user: Cl.principal(user) })
      );

      if (
        userScores.type === ClarityType.OptionalSome &&
        userScores.value.type === ClarityType.Tuple
      ) {
        expect(userScores.value.value.score).toBeUint(750);
        expect(userScores.value.value.nonce).toBeUint(2);
      }
    });

    it("allows non-sequential nonces (skipping)", async () => {
      const user = accounts.get("wallet_4")!;

      // First submission with nonce 1
      const sig1 = await createValidSignature(user, 100, 1);
      simnet.callPublicFn(
        "signature",
        "submit-score",
        [Cl.uint(100), Cl.uint(1), Cl.buffer(sig1)],
        user
      );

      // Skip to nonce 5 (should work since 5 > 1)
      const sig2 = await createValidSignature(user, 500, 5);
      const { result } = simnet.callPublicFn(
        "signature",
        "submit-score",
        [Cl.uint(500), Cl.uint(5), Cl.buffer(sig2)],
        user
      );

      expect(result).toHaveClarityType(ClarityType.ResponseOk);
    });
  });

  describe("error cases", () => {
    it("fails with ERR_BAD_SCORE (u102) for zero score", async () => {
      const sig = await createValidSignature(wallet1, 0, 100);

      const { result } = simnet.callPublicFn(
        "signature",
        "submit-score",
        [Cl.uint(0), Cl.uint(100), Cl.buffer(sig)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(102));
    });

    it("fails with ERR_REPLAY_NONCE (u101) for same nonce", async () => {
      const user = accounts.get("wallet_5")!;

      // First submission
      const sig1 = await createValidSignature(user, 100, 1);
      simnet.callPublicFn(
        "signature",
        "submit-score",
        [Cl.uint(100), Cl.uint(1), Cl.buffer(sig1)],
        user
      );

      // Try to reuse same nonce
      const sig2 = await createValidSignature(user, 200, 1);
      const { result } = simnet.callPublicFn(
        "signature",
        "submit-score",
        [Cl.uint(200), Cl.uint(1), Cl.buffer(sig2)],
        user
      );

      expect(result).toBeErr(Cl.uint(101));
    });

    it("fails with ERR_REPLAY_NONCE (u101) for lower nonce", async () => {
      const user = accounts.get("wallet_6")!;

      // First submission with nonce 5
      const sig1 = await createValidSignature(user, 100, 5);
      simnet.callPublicFn(
        "signature",
        "submit-score",
        [Cl.uint(100), Cl.uint(5), Cl.buffer(sig1)],
        user
      );

      // Try with lower nonce
      const sig2 = await createValidSignature(user, 200, 3);
      const { result } = simnet.callPublicFn(
        "signature",
        "submit-score",
        [Cl.uint(200), Cl.uint(3), Cl.buffer(sig2)],
        user
      );

      expect(result).toBeErr(Cl.uint(101));
    });

    it("fails with ERR_INVALID_SIG (u100) for tampered signature", async () => {
      const user = accounts.get("wallet_7")!;
      const sig = await createValidSignature(user, 100, 1);

      // Tamper with the signature (flip a byte)
      const tamperedSig = new Uint8Array(sig);
      tamperedSig[0] = tamperedSig[0] ^ 0xff;

      const { result } = simnet.callPublicFn(
        "signature",
        "submit-score",
        [Cl.uint(100), Cl.uint(1), Cl.buffer(tamperedSig)],
        user
      );

      expect(result).toBeErr(Cl.uint(100));
    });

    it("fails with ERR_INVALID_SIG (u100) for wrong score", async () => {
      const user = accounts.get("wallet_8")!;

      // Sign for score 100
      const sig = await createValidSignature(user, 100, 1);

      // Submit with different score
      const { result } = simnet.callPublicFn(
        "signature",
        "submit-score",
        [Cl.uint(999), Cl.uint(1), Cl.buffer(sig)],
        user
      );

      expect(result).toBeErr(Cl.uint(100));
    });

    it("fails with ERR_INVALID_SIG (u100) for wrong nonce in message", async () => {
      // Sign for nonce 1
      const sig = await createValidSignature(wallet1, 100, 50);

      // Submit with different nonce
      const { result } = simnet.callPublicFn(
        "signature",
        "submit-score",
        [Cl.uint(100), Cl.uint(51), Cl.buffer(sig)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(100));
    });

    it("fails with ERR_INVALID_SIG (u100) when different user submits", async () => {
      // Sign for wallet_1
      const sig = await createValidSignature(wallet1, 100, 999);

      // wallet_2 tries to submit the signature (different tx-sender)
      const { result } = simnet.callPublicFn(
        "signature",
        "submit-score",
        [Cl.uint(100), Cl.uint(999), Cl.buffer(sig)],
        wallet2
      );

      expect(result).toBeErr(Cl.uint(100));
    });

    it("fails with ERR_INVALID_SIG (u100) for signature from wrong key", async () => {
      const user = wallet2;

      // Use a different private key (not the server key)
      const wrongPrivateKey = hexToBytes(
        "0000000000000000000000000000000000000000000000000000000000000002"
      );
      const msgHash = getContractMessageHash(user, 100, 200);
      const signature = await secp.signAsync(msgHash, wrongPrivateKey, {
        lowS: true,
      });
      // Use same format: r || s || v
      const r = signature.r.toString(16).padStart(64, "0");
      const s = signature.s.toString(16).padStart(64, "0");
      const v = signature.recovery.toString(16).padStart(2, "0");
      const wrongSig = hexToBytes(r + s + v);

      const { result } = simnet.callPublicFn(
        "signature",
        "submit-score",
        [Cl.uint(100), Cl.uint(200), Cl.buffer(wrongSig)],
        user
      );

      expect(result).toBeErr(Cl.uint(100));
    });
  });

  describe("nonce tracking", () => {
    it("starts with nonce 0 for new users", async () => {
      const user = accounts.get("faucet")!; // Fresh user

      // Nonce 1 should work (> 0)
      const sig = await createValidSignature(user, 100, 1);
      const { result } = simnet.callPublicFn(
        "signature",
        "submit-score",
        [Cl.uint(100), Cl.uint(1), Cl.buffer(sig)],
        user
      );

      expect(result).toHaveClarityType(ClarityType.ResponseOk);
    });

    it("fails with nonce 0 for first submission", async () => {
      const user = deployer; // Fresh user for this test

      // Nonce 0 should fail (not > 0)
      const sig = await createValidSignature(user, 100, 0);
      const { result } = simnet.callPublicFn(
        "signature",
        "submit-score",
        [Cl.uint(100), Cl.uint(0), Cl.buffer(sig)],
        user
      );

      expect(result).toBeErr(Cl.uint(101)); // ERR_REPLAY_NONCE
    });

    it("updates last-nonce correctly", async () => {
      // Use deployer since we just used it above with nonce 0 (failed)
      // It should still have last-nonce = 0

      const sig = await createValidSignature(deployer, 100, 1);
      simnet.callPublicFn(
        "signature",
        "submit-score",
        [Cl.uint(100), Cl.uint(1), Cl.buffer(sig)],
        deployer
      );

      const lastNonce = simnet.getMapEntry(
        "signature",
        "user-last-nonce",
        Cl.tuple({ user: Cl.principal(deployer) })
      );

      expect(lastNonce).toHaveClarityType(ClarityType.OptionalSome);
      if (
        lastNonce.type === ClarityType.OptionalSome &&
        lastNonce.value.type === ClarityType.Tuple
      ) {
        expect(lastNonce.value.value.nonce).toBeUint(1);
      }
    });
  });
});
