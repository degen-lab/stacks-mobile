import { colors, Text, View } from "@/components/ui";
import { Button } from "@/components/ui/button";
import GradientBorder from "@/components/ui/gradient-border";
import { HighscoreIcon } from "@/components/ui/icons/highscore";
import { PlayIcon } from "@/components/ui/icons/play-icon";
import { useGameStore } from "@/lib/store/game";
import { Asset } from "expo-asset";
import { LinearGradient } from "expo-linear-gradient";
import { Ticket } from "lucide-react-native";
import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import { Image, Pressable } from "react-native";
import { SvgUri } from "react-native-svg";
import { getSkinById } from "@/features/play/components/skins/types";

type HeroIconComponent = ComponentType<{
  size?: number;
  width?: number;
  height?: number;
  color?: string;
}>;

type GameCardProps = {
  title: string;
  highscore: number;
  submissions: number;
  onPressPlay?: () => void;
};

export default function GameCard({
  title,
  highscore,
  submissions,
  onPressPlay,
}: GameCardProps) {
  const { selectedSkinId } = useGameStore();
  const selectedSkin = getSkinById(selectedSkinId);
  const [isIconLoaded, setIsIconLoaded] = useState(
    () => typeof selectedSkin.icon !== "number",
  );
  const iconSize = 82;

  useEffect(() => {
    setIsIconLoaded(typeof selectedSkin.icon !== "number");
  }, [selectedSkin.icon]);

  const renderIcon = () => {
    const iconToUse = selectedSkin.icon;

    if (typeof iconToUse === "number") {
      const asset = Asset.fromModule(iconToUse);
      const isSvg = asset.type === "svg";

      if (isSvg) {
        return (
          <View
            className="relative"
            style={{ width: iconSize, height: iconSize }}
            pointerEvents="none"
          >
            {!isIconLoaded && (
              <View className="absolute inset-0 rounded-lg bg-neutral-300 dark:bg-neutral-600" />
            )}
            <SvgUri
              uri={asset.uri}
              width={iconSize}
              height={iconSize}
              onLoad={() => setIsIconLoaded(true)}
              onError={() => setIsIconLoaded(true)}
              style={{ opacity: isIconLoaded ? 1 : 0 }}
            />
          </View>
        );
      }
      return (
        <View
          className="relative"
          style={{ width: iconSize, height: iconSize }}
          pointerEvents="none"
        >
          {!isIconLoaded && (
            <View className="absolute inset-0 rounded-full bg-neutral-300 dark:bg-neutral-600" />
          )}
          <Image
            source={iconToUse}
            onLoadStart={() => setIsIconLoaded(false)}
            onLoadEnd={() => setIsIconLoaded(true)}
            onError={() => setIsIconLoaded(true)}
            style={{
              width: iconSize,
              height: iconSize,
              resizeMode: "contain",
              opacity: isIconLoaded ? 1 : 0,
            }}
          />
        </View>
      );
    }
    const IconComponent = iconToUse as HeroIconComponent;
    return (
      <View pointerEvents="none">
        <IconComponent size={iconSize} width={iconSize} height={iconSize} />
      </View>
    );
  };

  return (
    <GradientBorder
      borderRadius={12}
      gradient={colors.stacks.gameCardStroke}
      angle={90}
      hasShadow={false}
    >
      <Pressable
        className="p-5 flex-row items-center justify-between"
        onPress={onPressPlay}
        disabled={!onPressPlay}
      >
        <View className="mr-4">{renderIcon()}</View>

        <View className="flex-1">
          <Text className="text-xl font-matter text-primary">{title}</Text>

          <View className="mt-1 gap-0.5">
            <View className="flex-row items-center gap-1.5">
              <HighscoreIcon size={14} />
              <Text className="text-sm text-secondary">
                Highscore: {highscore}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Ticket size={14} color="#595754" />
              <Text className="text-sm text-secondary">
                Submissions: {submissions}
              </Text>
            </View>
          </View>
        </View>

        <Button
          variant="primaryNavbar"
          size="icon"
          onPress={onPressPlay}
          className="size-12 rounded-full"
        >
          <View className="ml-1">
            <PlayIcon size={12} />
          </View>
        </Button>
      </Pressable>

      <LinearGradient
        colors={colors.stacks.gameCardFillRight}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 0.7 }}
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: "20%",
          borderRadius: 12,
        }}
      />
    </GradientBorder>
  );
}
