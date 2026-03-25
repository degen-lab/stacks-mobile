import {
  ConnectedWallet,
  type ConnectedWalletVariant,
} from "@/features/header/components/connected-wallet";

type ConnectWalletProps = {
  variant?: ConnectedWalletVariant;
};

export default function ConnectWallet({
  variant = "dual-stacking",
}: ConnectWalletProps) {
  return <ConnectedWallet variant={variant} />;
}
