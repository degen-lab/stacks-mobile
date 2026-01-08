import { queryClient } from "@/api/common/api-provider";
import { useStoreItems, useStorePurchaseMutation } from "@/api/store";
import type { StorePurchasedItem } from "@/api/store/types";
import { useUserProfile } from "@/api/user";
import type { UserItem, UserProfile } from "@/api/user/types";
import { getItemVariant } from "@/api/user/types";
import { Button, PointsBadge, Text, View } from "@/components/ui";
import { HeartIcon } from "@/components/ui/icons/heart";
import { RulerIcon } from "@/components/ui/icons/ruler";
import { Modal } from "@/components/ui/modal";
import { ItemType, ItemVariant } from "@/lib/enums";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import React, { useMemo, useState } from "react";

const POWER_UPS = [
  {
    variant: ItemVariant.Revive,
    title: "Revive",
    description: "Revive and continue after a failed move.",
    price: 15,
    Icon: HeartIcon,
  },
  {
    variant: ItemVariant.DropPoint,
    title: "Drop Point",
    description: "Shows where the bridge will land before building it.",
    price: 15,
    Icon: RulerIcon,
  },
] as const;

export const PowerUpsModal = React.forwardRef<BottomSheetModal, object>(
  (_props, ref) => {
    const { data: userProfile } = useUserProfile();
    const purchaseMutation = useStorePurchaseMutation();
    const { data: storeItems } = useStoreItems();
    const [error, setError] = useState<string | null>(null);
    const [pendingVariant, setPendingVariant] = useState<ItemVariant | null>(
      null,
    );

    const buildItemQuantities = (items?: UserItem[]) => {
      const quantities = new Map<ItemVariant, number>();
      if (!items) return quantities;
      items.forEach((item) => {
        const variant = getItemVariant(item);
        if (!variant) return;
        const current = quantities.get(variant) ?? 0;
        const quantity = item.quantity ?? 1;
        quantities.set(variant, current + quantity);
      });
      return quantities;
    };

    const mergePurchasedItems = (
      current: UserItem[],
      purchased: StorePurchasedItem[],
    ) => {
      if (purchased.length === 0) return current;
      const byId = new Map<number, UserItem>();
      current.forEach((item) => byId.set(item.id, item));
      purchased.forEach((item) => byId.set(item.id, item));
      return Array.from(byId.values());
    };

    const itemQuantities = useMemo(
      () => buildItemQuantities(userProfile?.items),
      [userProfile?.items],
    );

    const powerUps = useMemo(() => {
      if (!storeItems?.length) return POWER_UPS;
      const storeByVariant = new Map(
        storeItems
          .filter((item) => item.itemType === 0)
          .map((item) => [item.variant, item]),
      );
      return POWER_UPS.map((powerUp) => {
        const storeItem = storeByVariant.get(powerUp.variant);
        if (!storeItem) return powerUp;
        return {
          ...powerUp,
          title: storeItem.name ?? powerUp.title,
          description: storeItem.description ?? powerUp.description,
          price: storeItem.price,
        };
      });
    }, [storeItems]);

    const handlePurchase = async (variant: ItemVariant) => {
      setError(null);
      setPendingVariant(variant);
      try {
        const response = await purchaseMutation.mutateAsync({
          itemType: ItemType.PowerUp,
          quantity: 1,
          metadata: {
            variant,
          },
        });

        queryClient.setQueryData<UserProfile>(["user-profile"], (prev) => {
          if (!prev) return prev;
          const purchasedItems = response?.data?.items ?? [];
          const nextItems = mergePurchasedItems(
            prev.items ?? [],
            purchasedItems,
          );
          const nextPoints =
            typeof response?.data?.points === "number"
              ? response.data.points
              : prev.points;
          return {
            ...prev,
            items: nextItems,
            points: nextPoints,
          };
        });

        if (!response?.data?.items?.length) {
          await queryClient.invalidateQueries({ queryKey: ["user-profile"] });
        }
      } catch (purchaseError) {
        console.error("Failed to purchase item", purchaseError);
        setError("Unable to complete purchase. Please try again.");
      } finally {
        setPendingVariant(null);
      }
    };

    return (
      <Modal ref={ref} snapPoints={["60%"]}>
        <View className="flex-1 px-6 pb-8">
          <View className="flex flex-row items-center justify-between mb-6">
            <Text className="text-3xl font-matter text-primary mb-3">
              Power-ups
            </Text>
            <PointsBadge
              points={userProfile?.points ?? null}
              loading={userProfile === undefined}
            />
          </View>

          <View className="gap-4 mt-2">
            {powerUps.map(({ variant, title, description, price, Icon }) => {
              const ownedQuantity = itemQuantities.get(variant) ?? 0;
              const hasPoints =
                userProfile?.points === undefined ||
                userProfile?.points === null ||
                userProfile.points >= price;
              const missingPoints =
                userProfile?.points === undefined ||
                userProfile?.points === null
                  ? null
                  : Math.max(price - userProfile.points, 0);
              const isPending =
                pendingVariant === variant && purchaseMutation.isPending;

              return (
                <View
                  key={variant}
                  className="rounded-2xl border border-surface-secondary bg-white px-4 py-4"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-start gap-3 flex-1 pr-3">
                      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-sand-100 border border-sand-200">
                        <Icon size={24} />
                      </View>
                      <View className="flex-1 w-full">
                        <View className="flex-row items-center gap-2 justify-between">
                          <Text className="text-lg font-matter text-primary">
                            {title}
                          </Text>
                          <View className="rounded-full bg-sand-100 px-2 py-0.5">
                            <Text className="text-sm font-instrument-sans text-secondary">
                              Owned {ownedQuantity}
                            </Text>
                          </View>
                        </View>
                        <Text className="mt-1 text-sm font-instrument-sans text-secondary leading-5 max-w-40">
                          {description}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="mt-2">
                    <Button
                      label={
                        hasPoints || missingPoints === null
                          ? `Buy for ${price}`
                          : `Missing ${missingPoints} points`
                      }
                      size="default"
                      className="h-11 px-6 rounded-full"
                      disabled={!hasPoints}
                      loading={isPending}
                      onPress={() => handlePurchase(variant)}
                      testID={`power-up-buy-${variant}`}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          {error ? (
            <Text className="text-center text-sm font-instrument-sans text-red-600">
              {error}
            </Text>
          ) : null}
        </View>
      </Modal>
    );
  },
);

PowerUpsModal.displayName = "PowerUpsModal";
