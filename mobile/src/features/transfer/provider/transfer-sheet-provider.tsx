import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { TransferSheet } from "../container/TransferSheet";
import type { TransferSheetRequest } from "../types";

type TransferSheetContextValue = {
  openTransfer: (request?: TransferSheetRequest) => void;
  closeTransfer: () => void;
};

const TransferSheetContext = createContext<
  TransferSheetContextValue | undefined
>(undefined);

export function TransferSheetProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [request, setRequest] = useState<TransferSheetRequest | undefined>();
  const [requestVersion, setRequestVersion] = useState(0);

  const openTransfer = useCallback((nextRequest?: TransferSheetRequest) => {
    setRequest(nextRequest);
    setRequestVersion((version) => version + 1);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setRequest(undefined);
  }, []);

  const closeTransfer = handleClose;

  const contextValue = useMemo(
    () => ({
      openTransfer,
      closeTransfer,
    }),
    [closeTransfer, openTransfer],
  );

  return (
    <TransferSheetContext.Provider value={contextValue}>
      {children}
      <TransferSheet
        open={open}
        onClose={handleClose}
        request={request}
        requestVersion={requestVersion}
      />
    </TransferSheetContext.Provider>
  );
}

export function useTransferSheet() {
  const context = useContext(TransferSheetContext);
  if (!context) {
    throw new Error(
      "useTransferSheet must be used within a TransferSheetProvider",
    );
  }
  return context;
}
