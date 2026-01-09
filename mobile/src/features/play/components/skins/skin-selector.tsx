import { useStoreItems } from "@/api/store";
import type { StoreItem } from "@/api/store/types";
import { mapNumericTypeToItemType } from "@/api/store/types";
import { Text } from "@/components/ui";
import { ItemType } from "@/lib/enums";
import { Asset } from "expo-asset";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ImageSourcePropType,
  View,
} from "react-native";
import Animated, {
  clamp,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { SvgUri } from "react-native-svg";
import { scheduleOnRN } from "react-native-worklets";
import { useSkinSelector } from "./use-skin-selector";
import {
  DEFAULT_SKIN_ID,
  SKIN_ASSETS,
  SKIN_ID_TO_VARIANT,
  type Skin,
  type SkinId,
} from "./types";
import SkinItem from "./skin-item";

const { width } = Dimensions.get("window");
export const SKIN_ITEM_SIZE = width * 0.21;
export const SPACING = 12;
export const ITEM_TOTAL_SIZE = SKIN_ITEM_SIZE + SPACING;

type SkinSelectorViewProps = {
  availablePoints?: number;
  onSkinSelect?: (index: number) => void;
  selectedSkinId: SkinId;
  onSelectSkinId: (skinId: SkinId) => void;
  isSkinOwned: (skinId: SkinId) => boolean;
  onPurchaseSkin: (skinId: SkinId, cost: number) => Promise<void>;
  purchaseError?: string | null;
  isPurchasing?: boolean;
};

export const buildAvailableSkins = (storeItems?: StoreItem[]): Skin[] => {
  if (!storeItems?.length) {
    return SKIN_ASSETS.filter((skin) => skin.id === DEFAULT_SKIN_ID).map(
      (skin) => ({ ...skin, cost: 0 }),
    );
  }

  const storeSkinItems = new Map<StoreItem["variant"], StoreItem>();
  storeItems.forEach((item) => {
    if (mapNumericTypeToItemType(item.itemType) !== ItemType.Skin) return;
    storeSkinItems.set(item.variant, item);
  });

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
      name: storeItem.name || skin.name,
      cost: storeItem.price,
    });
    return acc;
  }, []);
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

export function SkinSelectorLayout({
  availablePoints = 0,
  onSkinSelect,
  selectedSkinId,
  onSelectSkinId,
  isSkinOwned,
  onPurchaseSkin,
  purchaseError,
  isPurchasing,
}: SkinSelectorViewProps) {
  const { data: storeItems } = useStoreItems();

  const availableSkins = useMemo(
    () => buildAvailableSkins(storeItems),
    [storeItems],
  );

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
    if (isPurchasing) return;
    const skinOwned = isSkinOwned(skin.id);
    if (skinOwned) {
      // If already owned or free, just set it as active
      onSelectSkinId(skin.id);
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
        <Text className="text-xs text-secondary" testID="skin-selector-status">
          {isSelected && isOwned
            ? "Selected"
            : isOwned
              ? "Owned"
              : `Tap to unlock for ${activeSkin.cost.toLocaleString()} points`}
        </Text>
        {purchaseError && (
          <Text
            className="text-xs text-red-600 mt-1"
            testID="skin-selector-error"
          >
            {purchaseError}
          </Text>
        )}
        {isPurchasing && (
          <Text
            className="text-xs text-secondary mt-1"
            testID="skin-selector-purchasing"
          >
            Processing purchase...
          </Text>
        )}
      </View>

      <Animated.FlatList
        ref={flatListRef}
        style={{
          height: SKIN_ITEM_SIZE * 3,
          flexGrow: 0,
        }}
        contentContainerStyle={{
          gap: SPACING,
          paddingHorizontal: (width - SKIN_ITEM_SIZE) / 2,
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

type SkinSelectorContainerProps = {
  availablePoints?: number;
  onSkinSelect?: (index: number) => void;
};

export default function SkinSelectorContainer({
  availablePoints = 0,
  onSkinSelect,
}: SkinSelectorContainerProps) {
  const {
    selectedSkinId,
    isSkinOwned,
    handlePurchaseSkin,
    error,
    isPurchasing,
    setSelectedSkinId,
  } = useSkinSelector(availablePoints);

  return (
    <SkinSelectorLayout
      availablePoints={availablePoints}
      onSkinSelect={onSkinSelect}
      selectedSkinId={selectedSkinId}
      onSelectSkinId={setSelectedSkinId}
      isSkinOwned={isSkinOwned}
      onPurchaseSkin={handlePurchaseSkin}
      purchaseError={error}
      isPurchasing={isPurchasing}
    />
  );
}
