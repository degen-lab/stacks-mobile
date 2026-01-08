import { useStoreItems } from "@/api/store";
import { colors, Text } from "@/components/ui";
import { useGameStore } from "@/lib/store/game";
import { Asset } from "expo-asset";
import { Lock } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ImageSourcePropType,
  Pressable,
  View,
} from "react-native";
import Animated, {
  clamp,
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { SvgUri } from "react-native-svg";
import { scheduleOnRN } from "react-native-worklets";
import { useSkinSelector } from "../hooks/use-skin-selector";
import {
  DEFAULT_SKIN_ID,
  SKIN_ASSETS,
  SKIN_ID_TO_VARIANT,
  type Skin,
} from "../types/skin";

const { width } = Dimensions.get("window");
const ITEM_SIZE = width * 0.21;
const SPACING = 12;
const ITEM_TOTAL_SIZE = ITEM_SIZE + SPACING;

type SkinSelectorProps = {
  availablePoints?: number;
  onSkinSelect?: (index: number) => void;
  ownedSkins?: Set<string>;
  isSkinOwned?: (skinId: string) => boolean;
  onPurchaseSkin?: (skinId: string, cost: number) => Promise<void>;
  purchaseError?: string | null;
  isPurchasing?: boolean;
};

const renderSkinIcon = (icon: number) => {
  const asset = Asset.fromModule(icon);
  const isSvg = asset.type === "svg";

  if (isSvg) {
    return <SvgUri uri={asset.uri} width={128} height={128} />;
  }

  return (
    <Image
      source={icon as ImageSourcePropType}
      style={{ width: 128, height: 128, resizeMode: "contain" }}
    />
  );
};

export default function SkinSelector({
  availablePoints = 0,
  onSkinSelect,
  ownedSkins: ownedSkinsProp,
  isSkinOwned: isSkinOwnedProp,
  onPurchaseSkin: onPurchaseSkinProp,
  purchaseError: purchaseErrorProp,
  isPurchasing: isPurchasingProp,
}: SkinSelectorProps) {
  // Use hook if props not provided (for backward compatibility)
  const hookData = useSkinSelector(availablePoints);
  const isSkinOwned = isSkinOwnedProp ?? hookData.isSkinOwned;
  const onPurchaseSkin = onPurchaseSkinProp ?? hookData.handlePurchaseSkin;
  const purchaseError = purchaseErrorProp ?? hookData.error;
  const { data: storeItems } = useStoreItems();

  const availableSkins = useMemo(() => {
    if (!storeItems?.length) {
      return SKIN_ASSETS.filter((skin) => skin.id === DEFAULT_SKIN_ID).map(
        (skin) => ({ ...skin, cost: 0 }),
      );
    }

    const storeSkinItems = new Map(
      storeItems
        .filter((item) => item.itemType === 1)
        .map((item) => [item.variant, item]),
    );

    return SKIN_ASSETS.reduce<Skin[]>((acc, skin) => {
      if (skin.id === DEFAULT_SKIN_ID) {
        acc.push({ ...skin, cost: 0 });
        return acc;
      }
      const variant =
        SKIN_ID_TO_VARIANT[
          skin.id as Exclude<typeof skin.id, typeof DEFAULT_SKIN_ID>
        ];
      const storeItem = variant ? storeSkinItems.get(variant) : undefined;
      if (!storeItem) return acc;
      acc.push({
        ...skin,
        name: storeItem.name ?? skin.name,
        cost: storeItem.price,
      });
      return acc;
    }, []);
  }, [storeItems]);

  const { selectedSkinId, setSelectedSkinId } = useGameStore();
  const initialIndex = availableSkins.findIndex((s) => s.id === selectedSkinId);
  const calculatedInitialIndex = initialIndex >= 0 ? initialIndex : 0;
  const scrollX = useSharedValue(calculatedInitialIndex);
  const [activeIndex, setActiveIndex] = useState(calculatedInitialIndex);
  const flatListRef = useRef<Animated.FlatList<Skin>>(null);
  const isProgrammaticScroll = useSharedValue(false);
  const lastCallbackIndex = useSharedValue(0);

  const scrollToIndex = (index: number, animated: boolean) => {
    const offset = index * ITEM_TOTAL_SIZE;
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToOffset({ offset, animated });
    });
  };

  useEffect(() => {
    const index = availableSkins.findIndex((s) => s.id === selectedSkinId);
    if (index >= 0 && index !== activeIndex) {
      setActiveIndex(index);
      scrollX.value = index;
      scrollToIndex(index, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSkinId]);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = clamp(
      e.contentOffset.x / ITEM_TOTAL_SIZE,
      0,
      availableSkins.length - 1,
    );
    if (!isProgrammaticScroll.value) {
      const newActiveIndex = Math.round(scrollX.value);
      scheduleOnRN(setActiveIndex, newActiveIndex);
      // Only call callback when index actually changes to prevent redundant calls
      if (onSkinSelect && newActiveIndex !== lastCallbackIndex.value) {
        lastCallbackIndex.value = newActiveIndex;
        scheduleOnRN(onSkinSelect, newActiveIndex);
      }
    }
  });

  const activeSkin = availableSkins[activeIndex];
  const isOwned = isSkinOwned(activeSkin.id);
  const isSelected = activeSkin.id === selectedSkinId;

  const handleUnlockPrompt = (skin: Skin) => {
    const skinOwned = isSkinOwned(skin.id);
    if (skinOwned) {
      // If already owned or free, just set it as active
      setSelectedSkinId(skin.id);
      return;
    }

    const canAfford = availablePoints >= skin.cost;
    Alert.alert(
      "Unlock skin",
      `Unlock ${skin.name} for ${skin.cost.toLocaleString()} points?`,
      [
        { text: "Not now", style: "cancel" },
        {
          text: canAfford ? "Unlock" : "Play to get points",
          onPress: async () => {
            if (canAfford) {
              await onPurchaseSkin(skin.id, skin.cost);
            }
          },
        },
      ],
    );
  };

  const handlePressSkin = (skin: Skin, index: number) => {
    if (index !== activeIndex) {
      // If tapping a different skin, just switch to it
      isProgrammaticScroll.value = true;
      lastCallbackIndex.value = index;
      scheduleOnRN(setActiveIndex, index);
      if (onSkinSelect) {
        scheduleOnRN(onSkinSelect, index);
      }
      scrollToIndex(index, true);
      // Re-enable scroll handler updates after animation completes
      setTimeout(() => {
        isProgrammaticScroll.value = false;
      }, 300);
    } else {
      // If tapping the active skin, show unlock prompt
      handleUnlockPrompt(skin);
    }
  };

  return (
    <View className="w-full items-center">
      <View className="mb-8 items-center gap-2">
        {renderSkinIcon(activeSkin.icon)}
        <Text className="text-lg font-matter text-primary">
          {activeSkin.name}
        </Text>
        <Text className="text-xs text-secondary">
          {isSelected
            ? "Selected"
            : isOwned
              ? "Owned"
              : `Tap to unlock for ${activeSkin.cost.toLocaleString()} points`}
        </Text>
        {purchaseError && (
          <Text className="text-xs text-red-600 mt-1">{purchaseError}</Text>
        )}
      </View>

      <Animated.FlatList
        ref={flatListRef}
        style={{
          height: ITEM_SIZE * 3,
          flexGrow: 0,
        }}
        contentContainerStyle={{
          gap: SPACING,
          paddingHorizontal: (width - ITEM_SIZE) / 2,
        }}
        data={availableSkins}
        initialScrollIndex={calculatedInitialIndex}
        getItemLayout={(_, index) => ({
          length: ITEM_TOTAL_SIZE,
          offset: ITEM_TOTAL_SIZE * index,
          index,
        })}
        keyExtractor={(_, index) => String(index)}
        renderItem={({ item, index }) => (
          <SkinItem
            skin={item}
            index={index}
            scrollX={scrollX}
            onPress={() => handlePressSkin(item, index)}
            isOwned={isSkinOwned(item.id)}
          />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={1000 / 60}
        snapToInterval={ITEM_TOTAL_SIZE}
        decelerationRate="fast"
        nestedScrollEnabled={true}
      />
    </View>
  );
}

type SkinItemProps = {
  skin: Skin;
  index: number;
  scrollX: SharedValue<number>;
  onPress: () => void;
  isOwned: boolean;
};

const SkinItem = ({
  skin,
  index,
  scrollX,
  onPress,
  isOwned,
}: SkinItemProps) => {
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
            [ITEM_SIZE / 3, 0, ITEM_SIZE / 3],
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
            width: ITEM_SIZE,
            height: ITEM_SIZE,
            borderRadius: ITEM_SIZE / 2,
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
            <Lock size={22} color="#FFFFFF" />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
};
