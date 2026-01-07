import { Asset } from "expo-asset";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  Text,
  View,
} from "react-native";
import { SvgUri } from "react-native-svg";

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

const Card = ({
  imageSource,
  imageSize = DEFAULT_SIZE,
  title,
  description,
  className,
  imageClassName,
  onPress,
}: CardProps) => {
  const renderImage = () => {
    if (!imageSource) return null;

    const asset = Asset.fromModule(imageSource as number);
    const isSvg = asset.type === "svg";

    return (
      <View
        className={`items-center justify-center ${imageClassName}`}
        style={{
          width: imageSize.width,
          height: imageSize.height,
        }}
      >
        {isSvg ? (
          <SvgUri
            uri={asset.uri}
            width={imageSize.width}
            height={imageSize.height}
          />
        ) : (
          <Image
            source={imageSource}
            style={{
              width: imageSize.width,
              height: imageSize.height,
            }}
            resizeMode="contain"
          />
        )}
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

  if (onPress) {
    return (
      <Pressable
        className={`w-full rounded-lg border border-surface-secondary bg-sand-100 p-4 ${className ?? ""}`}
        onPress={onPress}
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      className={`w-full rounded-lg border border-surface-secondary bg-sand-100 p-4 ${className ?? ""}`}
    >
      {content}
    </View>
  );
};

export default Card;
