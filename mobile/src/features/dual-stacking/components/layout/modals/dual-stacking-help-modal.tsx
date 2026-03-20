import type { RefObject } from "react";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";

import {
  BridgeHelpBookIcon,
  FaqHelpModal,
  type FaqHelpItem,
} from "@/components/ui";

const FAQ_ITEMS: readonly FaqHelpItem[] = [
  {
    id: "yield-source",
    title: "Where does the yield come from?",
    body: "Stacks is the only blockchain with Proof of Transfer - a consensus mechanism that channels BTC from miners to participants who secure the network by Stacking STX. At launch, Dual Stacking rewards will come from Stacks entities who volunteer their Stacking rewards earned via Proof of Transfer to Dual Stacking participants as sBTC.",
  },
  {
    id: "reward-frequency",
    title: "How often are rewards paid out?",
    body: "Rewards are paid out roughly every 2 weeks in line with PoX stacking cycles, with the first cycle beginning on November 5, 2025.",
  },
  {
    id: "reward-calculation",
    title: "How are rewards calculated?",
    body: "A Dual Stacking calculator is available in-app to help estimate your annual rewards based on the ratio of BTC/STX you are stacking. The system uses a square-root reward curve that creates diminishing returns, meaning your first STX paired with BTC has the biggest impact on your rewards, while additional STX continues to help at a decreasing rate. Review the Dual Stacking Litepaper for more details.",
  },
  {
    id: "stacking-impact",
    title: "How will this impact my existing Stacking rewards?",
    body: "Dual Stacking does not modify PoX consensus, meaning there is no direct change to native Stacking rewards. No action is required to continue natively Stacking. Dual Stacking may indirectly impact stacking rewards by increasing more stacking participation overall.",
  },
  {
    id: "trust-assumptions",
    title: "What are the trust assumptions?",
    body: "Dual Stacking operates as a transparent smart contract on the Stacks network. sBTC bridge operations are secured by a federation of reputable signers, with a 70% threshold of signer approval required for any transaction. No single entity can move funds unilaterally.",
  },
] as const;

type DualStackingHelpModalProps = {
  modalRef: RefObject<BottomSheetModal>;
};

export function DualStackingHelpModal({
  modalRef,
}: DualStackingHelpModalProps) {
  return (
    <FaqHelpModal
      modalRef={modalRef}
      title="Dual Stacking help"
      items={FAQ_ITEMS}
      headerIcon={<BridgeHelpBookIcon />}
    />
  );
}
