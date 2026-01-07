/**
 * Test script for signature.clar smart contract
 *
 * This script demonstrates how to:
 * 1. Generate a keypair for the backend server
 * 2. Create a message hash matching the Clarity contract's format
 * 3. Sign the message with secp256k1
 * 4. Verify the signature locally before submitting to the contract
 */

import * as secp from "@noble/secp256k1";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { serializeCV, uintCV, principalCV } from "@stacks/transactions";

// DOMAIN constant matching the contract: "GAME-V1"
const DOMAIN = hexToBytes("47414d452d5631");

/**
 * Serialize a uint to Clarity consensus buffer format
 * This matches the contract's (to-consensus-buff? x) for uint
 */
function uintToConsensusBuff(value) {
  const cv = uintCV(value);
  const serialized = serializeCV(cv); // returns hex string
  return hexToBytes(serialized);
}

/**
 * Serialize a principal to Clarity consensus buffer format
 * This matches the contract's (to-consensus-buff? p) for principal
 */
function principalToConsensusBuff(principal) {
  const cv = principalCV(principal);
  const serialized = serializeCV(cv); // returns hex string
  return hexToBytes(serialized);
}

/**
 * Create message hash matching the contract's make-message-hash function
 * sha256(DOMAIN || principal || score || nonce)
 */
function makeMessageHash(userPrincipal, score, nonce) {
  const principalBytes = principalToConsensusBuff(userPrincipal);
  const scoreBytes = uintToConsensusBuff(score);
  const nonceBytes = uintToConsensusBuff(nonce);

  // Concatenate: DOMAIN || principal || score || nonce
  const message = new Uint8Array([...DOMAIN, ...principalBytes, ...scoreBytes, ...nonceBytes]);

  console.log("Message components:");
  console.log("  DOMAIN:", bytesToHex(DOMAIN));
  console.log("  Principal bytes:", bytesToHex(principalBytes));
  console.log("  Score bytes:", bytesToHex(scoreBytes));
  console.log("  Nonce bytes:", bytesToHex(nonceBytes));
  console.log("  Full message:", bytesToHex(message));

  return sha256(message);
}

/**
 * Sign a message hash with the server's private key
 * Returns a 65-byte recoverable signature (r || s || v)
 * Format: r (32 bytes) || s (32 bytes) || recovery_id (1 byte, 0-3)
 */
async function signMessage(messageHash, privateKey) {
  const signature = await secp.signAsync(messageHash, privateKey, {
    lowS: true, // Enforce low-S for malleability protection
  });

  // Get recovery id
  const recoveryId = signature.recovery;

  // Create 65-byte signature: r (32 bytes) || s (32 bytes) || v (1 byte)
  const r = signature.r.toString(16).padStart(64, "0");
  const s = signature.s.toString(16).padStart(64, "0");
  const v = recoveryId.toString(16).padStart(2, "0"); // 0-3 for Clarity

  return hexToBytes(r + s + v);
}

/**
 * Verify a signature locally (for testing)
 */
function verifySignature(messageHash, signature, publicKey) {
  // Extract r and s from the 65-byte signature (first 64 bytes)
  const sigCompact = signature.slice(0, 64);
  return secp.verify(sigCompact, messageHash, publicKey);
}

// ============================================
// MAIN TEST
// ============================================

async function main() {
  console.log("=".repeat(60));
  console.log("GAME SCORE SIGNATURE TEST");
  console.log("=".repeat(60));
  console.log();

  // Generate a test keypair (in production, use a secure private key)
  const privateKey = secp.utils.randomPrivateKey();
  const publicKey = secp.getPublicKey(privateKey, true); // compressed (33 bytes)

  console.log("SERVER KEYPAIR (use these in your contract and backend):");
  console.log("  Private Key:", bytesToHex(privateKey));
  console.log("  Public Key (compressed):", bytesToHex(publicKey));
  console.log();
  console.log("Update your contract SERVER-PUBKEY constant to:");
  console.log(`  (define-constant SERVER-PUBKEY 0x${bytesToHex(publicKey)})`);
  console.log();

  // Test parameters
  const userPrincipal = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"; // Example testnet address
  const score = 1000n;
  const nonce = 1n;

  console.log("TEST PARAMETERS:");
  console.log("  User:", userPrincipal);
  console.log("  Score:", score.toString());
  console.log("  Nonce:", nonce.toString());
  console.log();

  // Create message hash
  console.log("CREATING MESSAGE HASH:");
  const messageHash = makeMessageHash(userPrincipal, score, nonce);
  console.log("  Message Hash:", bytesToHex(messageHash));
  console.log();

  // Sign the message
  console.log("SIGNING MESSAGE:");
  const signature = await signMessage(messageHash, privateKey);
  console.log("  Signature (65 bytes):", bytesToHex(signature));
  console.log("  Signature length:", signature.length, "bytes");
  console.log();

  // Verify locally
  console.log("LOCAL VERIFICATION:");
  const isValid = verifySignature(messageHash, signature, publicKey);
  console.log("  Signature valid:", isValid);
  console.log();

  // Output for contract call
  console.log("=".repeat(60));
  console.log("CONTRACT CALL PARAMETERS:");
  console.log("=".repeat(60));
  console.log();
  console.log("Use these values to call submit-score:");
  console.log(`  score: u${score}`);
  console.log(`  nonce: u${nonce}`);
  console.log(`  sig: 0x${bytesToHex(signature)}`);
  console.log();

  // Example with clarinet
  console.log("Example Clarinet test call:");
  console.log(`
const { result } = simnet.callPublicFn(
  "signature",
  "submit-score",
  [
    Cl.uint(${score}),
    Cl.uint(${nonce}),
    Cl.buffer(hexToBytes("${bytesToHex(signature)}")),
  ],
  "${userPrincipal}"
);
`);
}

main().catch(console.error);
