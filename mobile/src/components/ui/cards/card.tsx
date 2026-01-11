import { Asset } from "expo-asset";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  Text,
  View,
} from "react-native";
import { SvgUri } from "react-native-svg";
import { useSvgAsset } from "@/hooks/use-svg-asset";

type CardProps = {
  imageSource?: ImageSourcePropType;
  imageSize?: {
    width: number;
    height: number;
  };
  title: string;
  description: string;
  className?: string;
  imageClassName?: string;
  onPress?: () => void;
};

const DEFAULT_SIZE = { width: 64, height: 64 };
const BASE_CARD_CLASSES =
  "w-full rounded-lg border border-surface-secondary bg-sand-100 p-4";

export function Card({
  imageSource,
  imageSize = DEFAULT_SIZE,
  title,
  description,
  className,
  imageClassName,
  onPress,
}: CardProps) {
  const svgUri = useSvgAsset(
    imageSource && typeof imageSource === "number" ? imageSource : null,
  );

  const renderImage = () => {
    if (!imageSource) return null;

    const asset =
      typeof imageSource === "number" ? Asset.fromModule(imageSource) : null;
    const isSvg = asset?.type === "svg";

    if (isSvg) {
      if (!svgUri) {
        return (
          <View
            className={`items-center justify-center ${imageClassName ?? ""}`}
            style={{
              width: imageSize.width,
              height: imageSize.height,
            }}
          />
        );
      }

      return (
        <View
          className={`items-center justify-center ${imageClassName ?? ""}`}
          style={{
            width: imageSize.width,
            height: imageSize.height,
          }}
        >
          <SvgUri
            uri={svgUri}
            width={imageSize.width}
            height={imageSize.height}
          />
        </View>
      );
    }

    return (
      <View
        className={`items-center justify-center ${imageClassName ?? ""}`}
        style={{
          width: imageSize.width,
          height: imageSize.height,
        }}
      >
        <Image
          source={imageSource}
          style={{
            width: imageSize.width,
            height: imageSize.height,
          }}
          resizeMode="contain"
        />
      </View>
    );
  };

  const content = (
    <>
      {renderImage()}
      <View>
        <Text className="mb-1.5 font-matter text-xl text-primary">{title}</Text>
        <Text className="pr-12 text-sm font-instrument-sans-medium text-secondary leading-5">
          {description}
        </Text>
      </View>
    </>
  );

  const cardClassName = `${BASE_CARD_CLASSES} ${className ?? ""}`;

  if (onPress) {
    return (
      <Pressable
        className={cardClassName}
        onPress={onPress}
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    );
  }

  return <View className={cardClassName}>{content}</View>;
}
