import React, { createContext, useContext, useRef, useCallback } from "react";

import { TransakDrawer } from "../container/TransakDrawer";
import type { AssetOption, TransakDrawerRef } from "../types";

type TransakContextType = {
  openTransak: (defaultAsset?: AssetOption, action?: "buy" | "sell") => void;
  closeTransak: () => void;
};

const TransakContext = createContext<TransakContextType | undefined>(undefined);

export function TransakProvider({ children }: { children: React.ReactNode }) {
  const drawerRef = useRef<TransakDrawerRef>(null);

  const openTransak = useCallback(
    (defaultAsset?: AssetOption, action?: "buy" | "sell") => {
      drawerRef.current?.present(defaultAsset, action);
    },
    [],
  );

  const closeTransak = useCallback(() => {
    drawerRef.current?.dismiss();
  }, []);

  return (
    <TransakContext.Provider value={{ openTransak, closeTransak }}>
      {children}
      <TransakDrawer drawerRef={drawerRef} />
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
