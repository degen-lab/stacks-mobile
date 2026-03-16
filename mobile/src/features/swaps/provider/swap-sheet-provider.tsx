import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { SwapSheet } from "../screens/SwapSheet";
import type { SwapSheetRequest } from "../types";

type SwapSheetContextValue = {
  closeSwap: () => void;
  openSwap: (request?: SwapSheetRequest) => void;
};

const SwapSheetContext = createContext<SwapSheetContextValue | undefined>(
  undefined,
);

export function SwapSheetProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [request, setRequest] = useState<SwapSheetRequest | undefined>();
  const [requestVersion, setRequestVersion] = useState(0);

  const openSwap = useCallback((nextRequest?: SwapSheetRequest) => {
    setRequest(nextRequest);
    setRequestVersion((version) => version + 1);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setRequest(undefined);
  }, []);

  const contextValue = useMemo(
    () => ({
      closeSwap: handleClose,
      openSwap,
    }),
    [handleClose, openSwap],
  );

  return (
    <SwapSheetContext.Provider value={contextValue}>
      {children}
      <SwapSheet
        open={open}
        onClose={handleClose}
        request={request}
        requestVersion={requestVersion}
      />
    </SwapSheetContext.Provider>
  );
}

export function useSwapSheet() {
  const context = useContext(SwapSheetContext);

  if (!context) {
    throw new Error("useSwapSheet must be used within a SwapSheetProvider");
  }

  return context;
}
