import type { RefObject } from "react";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";

import {
  BridgeHelpBookIcon,
  FaqHelpModal,
  type FaqHelpItem,
} from "@/components/ui";

const FAQ_ITEMS: readonly FaqHelpItem[] = [
  {
    id: "what-is-earn",
    title: "What can I do in Earn?",
    body: "Earn brings together the main ways to put your assets to work in the app, including STX Stacking, Dual Stacking, and the sBTC Bridge.",
  },
  {
    id: "difference-between-features",
    title: "What is the difference between these features?",
    body: "Stacking locks STX to earn network rewards. Dual Stacking combines STX and sBTC participation for boosted rewards. The sBTC Bridge moves value between BTC and sBTC so you can use Bitcoin liquidity on Stacks.",
  },
  {
    id: "which-assets-are-used",
    title: "Which assets and addresses are used?",
    body: "Stacking uses your STX wallet. The bridge uses both your Bitcoin and Stacks addresses. Dual Stacking uses your Stacks address and can include sBTC held in wallet or in supported DeFi positions.",
  },
  {
    id: "where-should-i-start",
    title: "Where should I start?",
    body: "If you already hold STX, start with Stacking. If you want to bring Bitcoin into Stacks, use the sBTC Bridge. If you want to combine STX with sBTC for additional rewards, explore Dual Stacking.",
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
