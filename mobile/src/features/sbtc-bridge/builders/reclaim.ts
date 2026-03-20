import * as btc from "@scure/btc-signer";
import type { NetworkType } from "@degenlab/stacks-wallet-kit-core";

import { getBitcoinSignerNetwork } from "@/lib/bitcoin/network";
import type { BitcoinWalletPayment } from "@/lib/bitcoin/wallet";

import { createDepositPayment } from "./deposit";
import { equalBytes, hexToBytes } from "../utils/bytes";

type CreateReclaimTransactionParams = {
  network: NetworkType;
  payment: BitcoinWalletPayment;
  depositAmount: number;
  feeAmount: number;
  lockTime: number;
  depositScript: string;
  reclaimScript: string;
  txId: string;
  vout: number;
  bitcoinReturnAddress: string;
};

export function createReclaimTransaction({
  network,
  payment,
  depositAmount,
  feeAmount,
  lockTime,
  depositScript,
  reclaimScript,
  txId,
  vout,
  bitcoinReturnAddress,
}: CreateReclaimTransactionParams) {
  const depositScriptBytes = hexToBytes(depositScript);
  const reclaimScriptBytes = hexToBytes(reclaimScript);

  const depositPayment = createDepositPayment({
    network,
    depositScript: depositScriptBytes,
    reclaimScript: reclaimScriptBytes,
  });

  const tapLeafScript = depositPayment.tapLeafScript?.find(([, leaf]) =>
    equalBytes(leaf.subarray(0, -1), reclaimScriptBytes),
  );

  if (!tapLeafScript || !depositPayment.tapInternalKey) {
    throw new Error("Failed to build reclaim taproot leaf");
  }

  const tx = new btc.Transaction({
    allowUnknownInputs: true,
    allowUnknownOutputs: true,
  });

  tx.addInput({
    txid: txId,
    index: vout,
    sequence: lockTime,
    witnessUtxo: {
      script: depositPayment.script,
      amount: BigInt(depositAmount),
    },
    tapInternalKey: depositPayment.tapInternalKey,
    tapMerkleRoot: depositPayment.tapMerkleRoot,
    tapLeafScript: [tapLeafScript],
  });

  tx.addOutputAddress(
    bitcoinReturnAddress,
    BigInt(depositAmount - feeAmount),
    getBitcoinSignerNetwork(network),
  );

  tx.sign(payment.privateKey);
  tx.finalize();

  return {
    txId: tx.id,
    rawTxHex: tx.hex,
  };
}
