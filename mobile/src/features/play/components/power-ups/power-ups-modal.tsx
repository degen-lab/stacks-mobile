import { Modal } from "@/components/ui/modal";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import React from "react";
import PowerUpsContainer from "./power-ups";

export const PowerUpsModal = React.forwardRef<BottomSheetModal, object>(
  (_props, ref) => {
    return (
      <Modal ref={ref} snapPoints={["60%"]}>
        <PowerUpsContainer />
      </Modal>
    );
  },
);

PowerUpsModal.displayName = "PowerUpsModal";
