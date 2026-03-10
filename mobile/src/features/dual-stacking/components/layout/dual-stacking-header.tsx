import { ScreenHeader } from "@/components/ui";
import ConnectWallet from "../wallet/wallet-connected";

export function DualStackingHeader() {
  return <ScreenHeader title="Dual Stacking" rightSlot={<ConnectWallet />} />;
}
