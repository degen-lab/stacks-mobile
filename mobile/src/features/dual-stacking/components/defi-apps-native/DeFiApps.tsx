import type { LayoutChangeEvent } from "react-native";

import {
  ArkadikoIcon,
  BitflowIcon,
  BsdLogo,
  GraniteIcon,
  HermeticaIcon,
  VelarIcon,
  ZestIcon,
} from "@/components/ui";
import { useEnrollmentStatus } from "@/features/dual-stacking/hooks/useEnrollmentStatus";
import { DeFiAppsLayout } from "./DeFiApps.layout";
import type { DeFiAppCard } from "./DeFiCard";

type DeFiAppsProps = {
  onLayout?: (event: LayoutChangeEvent) => void;
};

export const DEFI_APP_TITLES = {
  enrolled: "Featured DeFi opportunities",
  default: "Stacks Ecosystem DeFi Apps",
} as const;

export const CARDS: readonly DeFiAppCard[] = [
  {
    id: "bitflow",
    variant: "defi",
    logoLabel: "Bitflow",
    logo: <BitflowIcon width={89} height={14} />,
    boost: "10x",
    description:
      "Trade and earn with sBTC across high-traffic liquidity pools.",
    ctaHref: "https://app.bitflow.finance/sbtc",
  },
  {
    id: "zest",
    variant: "defi",
    logoLabel: "Zest",
    logo: <ZestIcon width={67} height={16} />,
    boost: "10x",
    description: "Deploy sBTC on Zest’s lending protocol to earn BTC yield.",
    ctaHref:
      "https://www.zestprotocol.com/blog/earn-btc-rewards-up-to-12-5-apy-with-zest-lending-protocol",
  },
  {
    id: "granite",
    variant: "defi",
    logoLabel: "Granite",
    logo: <GraniteIcon width={73} height={20} />,
    boost: "10x",
    description: "Deploy sBTC on Granite’s lending protocol to earn BTC yield.",
    ctaHref: "https://www.granite.world/",
  },
  {
    id: "velar",
    variant: "defi",
    logoLabel: "Velar",
    logo: <VelarIcon width={70} height={16} />,
    boost: "10x",
    description: "Deploy sBTC on Velar for Bitcoin perpetuals trading.",
    ctaHref: "https://velar.com/",
  },
  {
    id: "bsd",
    variant: "defi",
    logoLabel: "BSD",
    logo: <BsdLogo width={68} height={24} />,
    boost: "10x",
    description:
      "Borrow BSD using sBTC to unlock liquidity, while keeping your Bitcoin.",
    ctaHref: "https://www.bsd.money/",
  },
  {
    id: "arkadiko",
    variant: "defi",
    logoLabel: "Arkadiko",
    logo: <ArkadikoIcon width={94} height={21} />,
    boost: "10x",
    description:
      "Borrow USDA using sBTC to unlock liquidity, while keeping your Bitcoin.",
    ctaHref: "https://www.arkadiko.finance/",
  },
  {
    id: "soon",
    variant: "soon",
    logoLabel: "Hermetica",
    logo: <HermeticaIcon width={94} height={19} />,
    description: "Borrow USDh against sBTC and stake on Hermetica",
  },
] as const;

export default function DeFiApps({ onLayout }: DeFiAppsProps) {
  const { enrolled } = useEnrollmentStatus();
  const title = enrolled ? DEFI_APP_TITLES.enrolled : DEFI_APP_TITLES.default;

  return <DeFiAppsLayout title={title} cards={CARDS} onLayout={onLayout} />;
}
