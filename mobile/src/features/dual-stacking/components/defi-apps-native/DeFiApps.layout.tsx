import type { LayoutChangeEvent } from "react-native";
import { useWindowDimensions } from "react-native";
import Carousel from "react-native-reanimated-carousel";

import { StarIcon, View } from "@/components/ui";
import Section from "../layout/Section";
import { DeFiCard, type DeFiAppCard } from "./DeFiCard";

type DeFiAppsLayoutProps = {
  title: string;
  cards: readonly DeFiAppCard[];
  onLayout?: (event: LayoutChangeEvent) => void;
};

const CARD_GAP = 8;
const CARD_MIN_WIDTH = 196;
const CARD_MAX_WIDTH = 272;
const HORIZONTAL_GUTTER = 32;
const CAROUSEL_HEIGHT = 150;

export function DeFiAppsLayout({
  title,
  cards,
  onLayout,
}: DeFiAppsLayoutProps) {
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = Math.max(screenWidth - HORIZONTAL_GUTTER, 0);
  const cardWidth = Math.min(
    Math.max(contentWidth * 0.72, CARD_MIN_WIDTH),
    CARD_MAX_WIDTH,
  );
  const itemWidth = cardWidth + CARD_GAP;

  return (
    <View onLayout={onLayout}>
      <Section icon={<StarIcon />} title={title}>
        <View className="relative overflow-visible" testID="defi-apps-section">
          <Carousel
            testID="defi-apps-carousel"
            width={itemWidth}
            height={CAROUSEL_HEIGHT}
            data={cards}
            loop={false}
            pagingEnabled={false}
            snapEnabled={true}
            overscrollEnabled={false}
            windowSize={3}
            style={{ width: contentWidth }}
            renderItem={({ item }) => (
              <View className="h-full justify-center">
                <DeFiCard card={item} width={cardWidth} />
              </View>
            )}
          />
        </View>
      </Section>
    </View>
  );
}
