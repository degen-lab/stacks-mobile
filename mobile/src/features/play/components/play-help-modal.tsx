import type { RefObject } from "react";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";

import { FaqHelpModal, type FaqHelpItem } from "@/components/ui";
import { GamepadIcon } from "@/components/ui/icons";

const FAQ_ITEMS: readonly FaqHelpItem[] = [
  {
    id: "how-to-play",
    title: "How do I play?",
    body: "Hold to grow the bridge, release to drop it. Land on the platform — don't miss.",
  },
  {
    id: "what-do-i-win",
    title: "What do I win?",
    body: "Points every run. Submit your score to the weekly contest and you could win real STX.",
  },
  {
    id: "how-revives-work",
    title: "Can I continue after falling?",
    body: "Yes. Watch a short ad to keep going. You can do it as many times as you want.",
  },
  {
    id: "what-is-ghost-mode",
    title: "What is Ghost Mode?",
    body: "Shows a preview line of where your bridge will land. Great for nailing tight gaps.",
  },
] as const;

type PlayHelpModalProps = {
  modalRef: RefObject<BottomSheetModal>;
};

export function PlayHelpModal({ modalRef }: PlayHelpModalProps) {
  return (
    <FaqHelpModal
      modalRef={modalRef}
      title="Play help"
      items={FAQ_ITEMS}
      headerIcon={<GamepadIcon size={40} />}
    />
  );
}
