import type { RefObject } from "react";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";

import {
  BridgeHelpBookIcon,
  FaqHelpModal,
  type FaqHelpItem,
} from "@/components/ui";

const FAQ_ITEMS: readonly FaqHelpItem[] = [
  {
    id: "what-can-i-do",
    title: "What can I do here?",
    body: "Put your crypto to work. Stack STX for BTC rewards, bridge your Bitcoin to Stacks, or do both for even more.",
  },
  {
    id: "what-is-stacking",
    title: "Stacking",
    body: "Lock your STX and earn BTC rewards every ~2 weeks.",
  },
  {
    id: "what-is-dual-stacking",
    title: "Dual Stacking",
    body: "Stack STX and sBTC together for higher rewards than either alone.",
  },
  {
    id: "what-is-sbtc-bridge",
    title: "sBTC Bridge",
    body: "Bring your BTC to Stacks. Bridge it to sBTC, earn with it, bridge back anytime.",
  },
] as const;

type EarnHelpModalProps = {
  modalRef: RefObject<BottomSheetModal>;
};

export function EarnHelpModal({ modalRef }: EarnHelpModalProps) {
  return (
    <FaqHelpModal
      modalRef={modalRef}
      title="Earn help"
      items={FAQ_ITEMS}
      headerIcon={<BridgeHelpBookIcon />}
    />
  );
}
