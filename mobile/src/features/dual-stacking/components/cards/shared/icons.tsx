import { ReactElement } from "react";
import { Image } from "@/components/ui";
import type { ImageSource } from "expo-image";

type CardIconElement = ReactElement<{ className?: string; isEmpty?: boolean }>;

interface CardIconOptions {
  source: ImageSource;
  alt: string;
  className?: string;
}

type CardIconProps = CardIconOptions & {
  isEmpty?: boolean;
};

const CardIcon = ({
  source,
  alt,
  className,
  isEmpty = false,
}: CardIconProps) => {
  const resolvedClassName = `${className ?? "size-7"}${isEmpty ? " opacity-30" : ""}`;
  return (
    <Image
      source={source}
      accessibilityLabel={alt}
      className={resolvedClassName}
      contentFit="contain"
    />
  );
};

function createIcon({
  source,
  alt,
  className,
}: CardIconOptions): CardIconElement {
  return <CardIcon source={source} alt={alt} className={className} />;
}

export const cardIcons = {
  sbtcWallet: createIcon({
    source: require("@/assets/images/sbtc_balance.svg"),
    alt: "sBTC Balance",
    className: "size-7 scale-[1.20]",
  }),
  sbtcDefi: createIcon({
    source: require("@/assets/images/sbtc_balance.svg"),
    alt: "sBTC DeFi Balance",
    className: "size-7 scale-[1.20]",
  }),
  stx: createIcon({
    source: require("@/assets/images/stx_balance.svg"),
    alt: "STX Balance",
    className: "size-7 scale-[1.20]",
  }),
} satisfies Record<string, CardIconElement>;
