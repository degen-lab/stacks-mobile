import {
  Pressable,
  View as RNView,
  ImageSourcePropType,
  ColorValue,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { Text, View } from "@/components/ui";
import GradientBorder from "@/components/ui/gradient-border";
import { Asset } from "expo-asset";
import { SvgUri } from "react-native-svg";
import { useSvgAsset } from "@/hooks/use-svg-asset";

type FeaturedEarnCardProps = {
  title: string;
  description: string;
  imageSource: ImageSourcePropType;
  imageSize?: { width: number; height: number };
  borderGradient: readonly [ColorValue, ColorValue, ...ColorValue[]];
  fillGradient: readonly [ColorValue, ColorValue, ...ColorValue[]];
  badges?: readonly string[];
  onPress?: () => void;
};

export function FeaturedEarnCard({
  title,
  description,
  imageSource,
  imageSize = { width: 105, height: 62 },
  borderGradient,
  fillGradient,
  badges,
  onPress,
}: FeaturedEarnCardProps) {
  const svgUri = useSvgAsset(
    imageSource && typeof imageSource === "number" ? imageSource : null,
  );

  const renderImage = () => {
    if (!imageSource) return null;

    const asset =
      typeof imageSource === "number" ? Asset.fromModule(imageSource) : null;
    const isSvg = asset?.type === "svg";

    if (isSvg && svgUri) {
      return (
        <View style={{ width: imageSize.width, height: imageSize.height }}>
          <SvgUri
            uri={svgUri}
            width={imageSize.width}
            height={imageSize.height}
          />
        </View>
      );
    }

    return null;
  };

  const content = (
    <>
      <View className="mb-3">{renderImage()}</View>
      <View>
        <Text className="mb-1.5 font-matter text-xl text-primary">{title}</Text>
        <Text
          className="text-sm font-instrument-sans text-secondary leading-5 mr-1.5"
          numberOfLines={2}
        >
          {description}
        </Text>
        {badges && badges.length > 0 && (
          <View className="flex-row items-center flex-wrap gap-1 mt-2.5">
            {badges.map((badge, index) => (
              <View key={index} className="rounded-md px-2 py-1 bg-sand-100">
                <Text className="text-xs font-instrument-sans text-primary">
                  {badge}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </>
  );

  return (
    <GradientBorder
      borderRadius={12}
      gradient={borderGradient}
      angle={90}
      hasShadow={false}
    >
      {onPress ? (
        <Pressable className="p-4" onPress={onPress}>
          {content}
        </Pressable>
      ) : (
        <RNView className="p-4">{content}</RNView>
      )}

      <LinearGradient
        colors={fillGradient}
        start={{ x: 0.7, y: 0.5 }}
        end={{ x: 1, y: 0.7 }}
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: "100%",
          opacity: 0.4,
          borderRadius: 12,
        }}
      />
    </GradientBorder>
  );
}
