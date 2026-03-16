import * as btc from "@scure/btc-signer";
import type { NetworkType } from "@degenlab/stacks-wallet-kit-core";

import { getBitcoinAddressError } from "./validation";
import type { BitcoinAddressUtxo, PreparedBitcoinSend } from "./types";
import type { BitcoinWalletPayment } from "./wallet";

const DEFAULT_DUST_THRESHOLD = 546n;

type PrepareBitcoinSendParams = {
  sender: BitcoinWalletPayment;
  recipient: string;
  amountSats: number;
  feeRate: number;
  network: NetworkType;
  utxos: BitcoinAddressUtxo[];
};

const toInput = (
  utxo: BitcoinAddressUtxo,
  sender: Pick<BitcoinWalletPayment, "script">,
) => ({
  txid: utxo.txid,
  index: utxo.vout,
  witnessUtxo: {
    script: sender.script,
    amount: BigInt(utxo.value),
  },
});

export function prepareBitcoinSend({
  sender,
  recipient,
  amountSats,
  feeRate,
  network,
  utxos,
}: PrepareBitcoinSendParams): PreparedBitcoinSend {
  const recipientError = getBitcoinAddressError(recipient, network);
  if (recipientError) {
    throw new Error(recipientError);
  }
  if (!Number.isFinite(amountSats) || amountSats <= 0) {
    throw new Error("Amount must be greater than 0");
  }
  if (!Number.isFinite(feeRate) || feeRate <= 0) {
    throw new Error("Unable to estimate the Bitcoin network fee");
  }
  if (utxos.length === 0) {
    throw new Error("No spendable BTC UTXOs found");
  }

  const selection = btc.selectUTXO(
    utxos.map((utxo) => toInput(utxo, sender)),
    [{ address: recipient.trim(), amount: BigInt(amountSats) }],
    "default",
    {
      changeAddress: sender.address,
      feePerByte: BigInt(Math.max(1, Math.ceil(feeRate))),
      bip69: true,
      createTx: true,
      network: sender.network,
      // @scure/btc-signer runtime expects bigint here, but the published d.ts
      // still declares `dust` as number.
      dust: DEFAULT_DUST_THRESHOLD as unknown as number,
    },
  );

  if (!selection?.tx) {
    throw new Error("Insufficient BTC balance for amount plus network fee");
  }

  selection.tx.sign(sender.privateKey);
  selection.tx.finalize();

  const inputSats = selection.inputs.reduce((sum, input) => {
    return sum + Number(input.witnessUtxo?.amount ?? 0n);
  }, 0);

  const senderOutputs = selection.outputs.reduce((sum, output) => {
    if ("address" in output && output.address === sender.address) {
      return sum + Number(output.amount);
    }
    return sum;
  }, 0);

  const changeSats =
    recipient.trim() === sender.address
      ? Math.max(0, senderOutputs - amountSats)
      : senderOutputs;

  return {
    txId: selection.tx.id,
    rawTxHex: selection.tx.hex,
    feeSats: Number(selection.tx.fee),
    feeRate: Math.max(1, Math.ceil(feeRate)),
    inputSats,
    amountSats,
    changeSats,
    recipient: recipient.trim(),
    senderAddress: sender.address,
  };
}
