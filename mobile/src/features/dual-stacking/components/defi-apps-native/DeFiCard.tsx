import type { ReactNode } from "react";

import { Text, View } from "@/components/ui";
import { LinkUnderline } from "@/components/ui/link-underline";

export type DeFiAppCard = {
  id: string;
  variant: "defi" | "soon";
  logo: ReactNode;
  logoLabel: string;
  boost?: string;
  description: string;
  ctaHref?: string;
};

type DeFiCardProps = {
  card: DeFiAppCard;
  width: number;
};

export function DeFiCard({ card, width }: DeFiCardProps) {
  const isSoon = card.variant === "soon";

  return (
    <View
      testID={`defi-app-card-${card.id}`}
      className={`h-[138px] rounded-xl border border-border-secondary bg-sand-100 py-5 pr-4 pl-6 ${
        isSoon ? "gap-3" : "gap-4"
      }`}
      style={{ width }}
    >
      <View className="min-h-6 flex-row items-start justify-between gap-3">
        <View className="min-h-6 justify-center">{card.logo}</View>

        {!isSoon && card.boost ? (
          <View className="items-center justify-center rounded-lg bg-surface-primary px-2 py-1">
            <Text className="font-instrument-sans-medium text-xs text-secondary">
              {card.boost} Boost
            </Text>
          </View>
        ) : null}
      </View>

      <View className={`flex-1 items-start ${isSoon ? "gap-4" : "gap-2"}`}>
        <Text
          className={`max-w-[208px] font-instrument-sans-medium text-xs ${
            isSoon ? "text-tertiary" : "text-secondary"
          }`}
          numberOfLines={3}
        >
          {card.description}
        </Text>

        {!isSoon && card.ctaHref ? (
          <LinkUnderline
            href={card.ctaHref}
            variant="cardDescription"
            size="xs"
            accessibilityLabel={`Learn more about ${card.logoLabel}`}
          >
            Learn more
          </LinkUnderline>
        ) : null}

        {isSoon ? (
          <View
            testID={`defi-app-badge-${card.id}`}
            className="rounded-full bg-surface-primary px-2 py-1"
          >
            <Text className="font-matter-mono text-[10px] tracking-[1.5px] text-secondary">
              SOON
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
