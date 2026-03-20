import * as btc from "@scure/btc-signer";
import type { NetworkType } from "@degenlab/stacks-wallet-kit-core";

import type { BitcoinAddressUtxo } from "@/lib/bitcoin/types";
import type { BitcoinWalletPayment } from "@/lib/bitcoin/wallet";

const DEFAULT_DUST_THRESHOLD = 546n;

type PrepareSbtcDepositParams = {
  sender: BitcoinWalletPayment;
  depositAddress: string;
  amountSats: number;
  feeRate: number;
  network: NetworkType;
  utxos: BitcoinAddressUtxo[];
};

export type PreparedSbtcDeposit = {
  txId: string;
  rawTxHex: string;
  feeSats: number;
  feeRate: number;
  inputSats: number;
  changeSats: number;
  amountSats: number;
  depositAddress: string;
  depositOutputIndex: number;
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

export function prepareSbtcDeposit({
  sender,
  depositAddress,
  amountSats,
  feeRate,
  utxos,
}: PrepareSbtcDepositParams): PreparedSbtcDeposit {
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
    [{ address: depositAddress.trim(), amount: BigInt(amountSats) }],
    "default",
    {
      changeAddress: sender.address,
      feePerByte: BigInt(Math.max(1, Math.ceil(feeRate))),
      bip69: true,
      createTx: true,
      network: sender.network,
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

  let depositOutputIndex = -1;
  for (let index = 0; index < selection.tx.outputsLength; index += 1) {
    if (
      selection.tx.getOutputAddress(index, sender.network) === depositAddress
    ) {
      depositOutputIndex = index;
      break;
    }
  }

  if (depositOutputIndex === -1) {
    throw new Error("Unable to locate deposit output index");
  }

  return {
    txId: selection.tx.id,
    rawTxHex: selection.tx.hex,
    feeSats: Number(selection.tx.fee),
    feeRate: Math.max(1, Math.ceil(feeRate)),
    inputSats,
    changeSats: senderOutputs,
    amountSats,
    depositAddress: depositAddress.trim(),
    depositOutputIndex,
  };
}
