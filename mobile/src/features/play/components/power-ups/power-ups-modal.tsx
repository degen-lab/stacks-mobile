import { Modal } from "@/components/ui/modal";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import React from "react";
import PowerUpsContainer from "./power-ups";

export const PowerUpsModal = React.forwardRef<BottomSheetModal, object>(
  (_props, ref) => {
    return (
      <Modal ref={ref} enableDynamicSizing={true}>
        <BottomSheetView>
          <PowerUpsContainer />
        </BottomSheetView>
      </Modal>
    );
  },
);

PowerUpsModal.displayName = "PowerUpsModal";
