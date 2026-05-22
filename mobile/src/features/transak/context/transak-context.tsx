import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useState,
} from "react";

import { ComingSoonSheet } from "../components/coming-soon-sheet";
import { TransakDrawer } from "../container/TransakDrawer";
import type { AssetOption, TransakDrawerRef } from "../types";

type TransakContextType = {
  openTransak: (defaultAsset?: AssetOption, action?: "buy" | "sell") => void;
  closeTransak: () => void;
};

const TransakContext = createContext<TransakContextType | undefined>(undefined);

export function TransakProvider({ children }: { children: React.ReactNode }) {
  const drawerRef = useRef<TransakDrawerRef>(null);
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);

  const openTransak = useCallback(
    (_defaultAsset?: AssetOption, _action?: "buy" | "sell") => {
      setIsComingSoonOpen(true);
    },
    [],
  );

  const closeTransak = useCallback(() => {
    setIsComingSoonOpen(false);
    drawerRef.current?.dismiss();
  }, []);

  return (
    <TransakContext.Provider value={{ openTransak, closeTransak }}>
      {children}
      <TransakDrawer drawerRef={drawerRef} />
      <ComingSoonSheet
        open={isComingSoonOpen}
        onClose={() => setIsComingSoonOpen(false)}
      />
    </TransakContext.Provider>
  );
}

export function useTransak() {
  const context = useContext(TransakContext);
  if (!context) {
    throw new Error("useTransak must be used within a TransakProvider");
  }
  return context;
}
