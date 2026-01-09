import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Skin } from "./types";
import { Pressable, View } from "react-native";
import { LockIcon } from "lucide-react-native";
import { colors } from "@/components/ui";
import { SKIN_ITEM_SIZE } from "./skin-selector";

type SkinItemProps = {
  skin: Skin;
  index: number;
  scrollX: SharedValue<number>;
  onPress: () => void;
  isOwned: boolean;
};

export default function SkinItem({
  skin,
  index,
  scrollX,
  onPress,
  isOwned,
}: SkinItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const borderWidth = interpolate(
      scrollX.value,
      [index - 0.4, index - 0.15, index + 0.15, index + 0.4],
      [0, 3, 3, 0],
      "clamp",
    );

    return {
      borderWidth,
      borderColor: colors.white,
      transform: [
        {
          translateY: interpolate(
            scrollX.value,
            [index - 1, index, index + 1],
            [SKIN_ITEM_SIZE / 3, 0, SKIN_ITEM_SIZE / 3],
          ),
        },
        {
          scale: interpolate(
            scrollX.value,
            [index - 1, index, index + 1],
            [0.9, 1, 0.9],
          ),
        },
      ],
    };
  });

  return (
    <Pressable onPress={onPress} style={{ alignItems: "center" }}>
      <Animated.View
        style={[
          animatedStyle,
          {
            width: SKIN_ITEM_SIZE,
            height: SKIN_ITEM_SIZE,
            borderRadius: SKIN_ITEM_SIZE / 2,
            backgroundColor: skin.accent,
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
          },
        ]}
      >
        {!isOwned && skin.cost > 0 && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.35)",
              justifyContent: "center",
              alignItems: "center",
            }}
            pointerEvents="none"
          >
            <LockIcon size={22} color="#FFFFFF" />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}
