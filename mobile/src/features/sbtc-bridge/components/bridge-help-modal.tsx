import type { RefObject } from "react";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";

import {
  BridgeHelpBookIcon,
  FaqHelpModal,
  type FaqHelpItem,
} from "@/components/ui";

const FAQ_ITEMS: readonly FaqHelpItem[] = [
  {
    id: "what-is-sbtc",
    title: "What is sBTC?",
    body: "sBTC is Bitcoin you can use on Stacks. It is designed to track BTC 1:1, so you can use Bitcoin in Stacks apps without leaving the Stacks ecosystem.",
  },
  {
    id: "how-bridge-works",
    title: "How does the bridge work?",
    body: "For deposits, you send BTC to the bridge address and wait for Bitcoin confirmations. Once confirmed, sBTC is minted to your selected Stacks address. For withdrawals, you burn sBTC on Stacks and BTC is released to your selected Bitcoin address.",
  },
  {
    id: "deposit-timing",
    title: "How long do deposits take?",
    body: "Deposits usually take around 60 minutes. The bridge waits for 6 Bitcoin confirmations before sBTC is minted, and network conditions can make that timing shorter or longer.",
  },
  {
    id: "withdrawal-timing",
    title: "How long do withdrawals take?",
    body: "Withdrawals usually take around 30 minutes. Timing depends on Stacks transaction finalization, signer processing, and overall network activity.",
  },
] as const;

type BridgeHelpModalProps = {
  modalRef: RefObject<BottomSheetModal>;
};

export function BridgeHelpModal({ modalRef }: BridgeHelpModalProps) {
  return (
    <FaqHelpModal
      modalRef={modalRef}
      title="sBTC Bridge help"
      items={FAQ_ITEMS}
      headerIcon={<BridgeHelpBookIcon />}
    />
  );
}
