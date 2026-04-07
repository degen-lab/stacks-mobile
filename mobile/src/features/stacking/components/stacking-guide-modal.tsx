import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { RefObject } from "react";

import {
  BridgeHelpBookIcon,
  FaqHelpModal,
  type FaqHelpItem,
} from "@/components/ui";

type Props = {
  modalRef: RefObject<BottomSheetModal>;
};

const FAQ_ITEMS: readonly FaqHelpItem[] = [
  {
    id: "what-is-stacking",
    title: "What is Stacking?",
    body: "Stacking lets you lock STX to help secure the Stacks network and earn BTC-denominated rewards during reward cycles.",
  },
  {
    id: "who-controls-my-stx",
    title: "Do I keep control of my STX?",
    body: "Yes. Your STX stays in your wallet. You authorize the pool to lock it for Stacking, but the pool cannot freely transfer your funds.",
  },
  {
    id: "how-long-is-it-locked",
    title: "How long is my STX locked?",
    body: "Stacking works in cycles of roughly 2 weeks. Once your STX is committed to a cycle, it remains locked until that cycle finishes.",
  },
  {
    id: "when-do-i-get-rewards",
    title: "When do rewards arrive?",
    body: "Rewards are distributed per cycle. Timing and amount can vary based on network participation, the pool, and overall protocol conditions.",
  },
  {
    id: "what-happens-if-i-revoke",
    title: "What happens if I revoke?",
    body: "If you revoke delegation, your STX does not unlock instantly. It becomes available after the current locked cycle ends.",
  },
  {
    id: "keep-stx-for-fees",
    title: "Why should I keep some STX unlocked?",
    body: "Always keep at least 1 STX unlocked in your wallet. You need unlocked STX to pay transaction fees — including the fee to revoke your delegation and unlock your funds when the time comes.",
  },
] as const;

export function StackingGuideModal({ modalRef }: Props) {
  return (
    <FaqHelpModal
      modalRef={modalRef}
      title="Stacking help"
      items={FAQ_ITEMS}
      headerIcon={<BridgeHelpBookIcon />}
    />
  );
}
