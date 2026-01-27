import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Button, Text, View } from "@/components/ui";
import { StackingOptionCard } from "../components/stacking-option-card";
import { StackingCalculator } from "../components/stacking-calculator";
import { PoolOptionsModal } from "../components/pool-options-modal";
import { useStacking } from "../hooks/use-stacking";

export function StackingScreen() {
  const { userStats, isStacking, stackingInfo } = useStacking();

  // Update Flow State
  const [hasChanges, setHasChanges] = useState(false);
  const [isValidUpdate, setIsValidUpdate] = useState(false);
  const [showPoolOptions, setShowPoolOptions] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<number | undefined>(
    undefined,
  );

  const handleStackNow = () => {
    if (isStacking) {
      console.log("Update Position pressed");
    } else {
      console.log("Stack Now pressed");
    }
  };

  const handleMenuPress = () => {
    setShowPoolOptions(true);
  };

  const handleCalculatorUpdate = (
    changed: boolean,
    valid: boolean,
    newAmount?: number,
  ) => {
    setHasChanges(changed);
    setIsValidUpdate(valid);
    setPendingAmount(newAmount);
  };

  const activePosition = userStats?.activePosition;

  // CTA Logic
  const getCtaLabel = () => {
    if (!isStacking) return "Stack Now";
    if (!hasChanges) return "No changes";
    if (!isValidUpdate) return "Cannot apply";

    if (activePosition && pendingAmount !== undefined) {
      if (pendingAmount > activePosition.lockedAmount) return "Increase Stacking";
      if (pendingAmount < activePosition.lockedAmount)
        return "Cannot decrease locked amount";
    }

    return "Update Position";
  };

  const isCtaDisabled =
    isStacking &&
    (!hasChanges ||
      !isValidUpdate ||
      (activePosition &&
        pendingAmount !== undefined &&
        pendingAmount < activePosition.lockedAmount));

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View className="flex-1 bg-surface-tertiary">
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-8"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View className="p-4">
            <View className="mb-4">
              <Text className="mb-3 font-matter text-xl text-primary">
                {activePosition ? "Your stacking pool" : "Available pools"}
              </Text>
              <StackingOptionCard
                title="Fast Pool"
                description="The oldest stacking pool on Stacks"
                apy={stackingInfo.apy}
                selected={true}
                onPress={() => { }}
                registrationStatus="open"
                registrationClosesIn="~4 Days"
                lockingTime="2-week cycles"
                minimumStx={40}
                onMenuPress={handleMenuPress}
                activePosition={activePosition}
                price={stackingInfo.price}
              />
            </View>

            <View className="mb-4">
              <StackingCalculator
                availableBalance={userStats?.liquidBalance || 0}
                activePosition={activePosition}
                onUpdateChange={handleCalculatorUpdate}
              />
            </View>

            <Button
              label={getCtaLabel()}
              variant="gamePrimary"
              size="lg"
              onPress={handleStackNow}
              disabled={isCtaDisabled}
              className={isCtaDisabled ? "opacity-50" : ""}
            />

            <View className="mt-2 px-4">
              <Text className="text-center text-xs font-instrument-sans text-secondary">
                Rewards may vary with network conditions.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
      <PoolOptionsModal
        visible={showPoolOptions}
        onClose={() => setShowPoolOptions(false)}
        activePosition={activePosition}
      />
    </KeyboardAvoidingView>
  );
}
