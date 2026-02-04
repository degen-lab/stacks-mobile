import { useState } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { Button, colors } from "@/components/ui";
import {
  X,
  ChevronRight,
  AlertTriangle,
  List,
  QrCode,
} from "lucide-react-native";
import { Input } from "@/components/ui/input";
import type { StackingPosition } from "../types";

type Props = {
  visible: boolean;
  onClose: () => void;
  activePosition: StackingPosition | undefined;
  onRevoke?: () => void;
};

type ViewState = "main" | "advanced" | "change_address" | "leave_pool";

export function PoolOptionsModal({
  visible,
  onClose,
  activePosition,
  onRevoke,
}: Props) {
  const [currentView, setCurrentView] = useState<ViewState>("main");
  const [newRewardAddress, setNewRewardAddress] = useState("");

  const handleClose = () => {
    setCurrentView("main");
    setNewRewardAddress("");
    onClose();
  };

  // const handleSupport = () => {
  //   // Determine pool specific URL if possible, for now generic or fast pool
  //   Linking.openURL("https://fastpool.org"); // Example for Fast Pool
  //   handleClose();
  // };

  const renderMainView = () => (
    <View className="gap-2">
      <Pressable
        onPress={() => setCurrentView("advanced")}
        className="flex-row items-center justify-between rounded-xl bg-surface-primary p-4 active:bg-surface-secondary"
      >
        <View className="flex-row items-center gap-3">
          <List size={24} color={colors.neutral[900]} />
          <Text className="text-base font-instrument-sans-medium text-primary">
            Pool Details
          </Text>
        </View>
        <ChevronRight size={20} color={colors.neutral[400]} />
      </Pressable>

      {/* <Pressable
        onPress={() => setCurrentView("change_address")}
        className="flex-row items-center justify-between rounded-xl bg-surface-primary p-4 active:bg-surface-secondary"
      >
        <View className="flex-row items-center gap-3">
          <Wallet size={24} color={colors.neutral[900]} />
          <Text className="text-base font-instrument-sans-medium text-primary">
            Change Reward Address
          </Text>
        </View>
        <ChevronRight size={20} color={colors.neutral[400]} />
      </Pressable> */}

      <Pressable
        onPress={() => setCurrentView("leave_pool")}
        className="mt-2 flex-row items-center justify-between rounded-xl bg-danger-500/5 p-4 active:bg-danger-500/10"
      >
        <View className="flex-row items-center gap-3">
          <AlertTriangle size={24} color={colors.danger[500]} />
          <Text className="text-base font-instrument-sans-medium text-danger-600">
            Leave Pool
          </Text>
        </View>
        <ChevronRight size={20} color={colors.danger[300]} />
      </Pressable>
    </View>
  );

  const renderAdvancedView = () => (
    <View className="gap-4">
      <Text className="text-sm font-instrument-sans text-secondary">
        Details about your current stacking delegation.
      </Text>

      <View className="rounded-2xl border border-surface-secondary bg-bg-primary p-4">
        <View className="mb-4 flex-row items-center justify-between border-b border-surface-secondary pb-4">
          <Text className="text-sm font-instrument-sans text-secondary">
            Pool Name
          </Text>
          <Text className="font-matter text-primary">
            {activePosition?.poolName || "Fast Pool"}
          </Text>
        </View>
        <View className="mb-4 flex-row items-center justify-between border-b border-surface-secondary pb-4">
          <Text className="text-sm font-instrument-sans text-secondary">
            Delegated Amount
          </Text>
          <Text className="font-matter text-primary">
            {activePosition?.lockedAmount.toFixed(6)} STX
          </Text>
        </View>
        <View className="mb-4 flex-row items-center justify-between border-b border-surface-secondary pb-4">
          <Text className="text-sm font-instrument-sans text-secondary">
            Lock Duration
          </Text>
          <Text className="font-matter text-primary">
            {activePosition?.lockDuration} cycle
            {activePosition?.lockDuration !== 1 ? "s" : ""}
          </Text>
        </View>
        <View className="mb-4 flex-row items-center justify-between border-b border-surface-secondary pb-4">
          <Text className="text-sm font-instrument-sans text-secondary">
            Next Unlock
          </Text>
          <Text className="font-matter text-primary">
            ~{activePosition?.nextUnlockDays} days
          </Text>
        </View>
        {activePosition?.rewardedStxAmount !== undefined &&
          activePosition?.rewardedStxAmount !== null && (
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-instrument-sans text-secondary">
                Total Rewards Earned
              </Text>
              <Text className="font-matter text-lg text-primary">
                {activePosition.rewardedStxAmount.toFixed(6)} STX
              </Text>
            </View>
          )}
      </View>
    </View>
  );

  const renderChangeAddressView = () => (
    <View className="gap-4">
      <Text className="text-sm font-instrument-sans text-secondary">
        Update the Bitcoin address where you receive your stacking rewards.
      </Text>

      <View>
        <Input
          label="Bitcoin Address"
          placeholder="bc1q..."
          value={newRewardAddress}
          onChangeText={setNewRewardAddress}
          autoCapitalize="none"
        />
        <Pressable className="absolute right-4 top-[38px]">
          <QrCode size={20} color={colors.neutral[400]} />
        </Pressable>
      </View>

      <Button
        label="Update Address"
        variant="gamePrimary"
        onPress={() => {
          // Implement update logic
          handleClose();
        }}
        disabled={!newRewardAddress}
      />
    </View>
  );

  const renderLeavePoolView = () => (
    <View className="gap-4">
      <View className="rounded-2xl bg-danger-500/5 p-4">
        <View className="mb-2 flex-row items-center gap-2">
          <AlertTriangle size={20} color={colors.danger[500]} />
          <Text className="text-base font-instrument-sans-semibold text-danger-600">
            Warning
          </Text>
        </View>
        <Text className="text-sm font-instrument-sans text-secondary leading-5">
          Revoking your delegation will stop your rewards. You will receive your
          locked STX back after the current cycle ends.
        </Text>
      </View>

      <Button
        label="Revoke Delegation"
        variant="destructive"
        onPress={() => {
          if (onRevoke) {
            onRevoke();
          }
          handleClose();
        }}
      />
    </View>
  );

  const getTitle = () => {
    switch (currentView) {
      case "main":
        return "Pool Options";
      case "advanced":
        return "Advanced Details";
      case "change_address":
        return "Change Reward Address";
      case "leave_pool":
        return "Leave Pool";
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-[24px] bg-surface-tertiary p-6 pb-12">
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center gap-2">
              {currentView !== "main" && (
                <Pressable
                  onPress={() => setCurrentView("main")}
                  className="mr-1"
                >
                  <Text className="text-2xl text-primary">←</Text>
                </Pressable> // Simpler back button
              )}
              <Text className="font-matter text-xl text-primary">
                {getTitle()}
              </Text>
            </View>
            <Pressable
              onPress={handleClose}
              className="h-8 w-8 items-center justify-center rounded-full bg-surface-secondary"
            >
              <X size={20} color={colors.neutral[900]} />
            </Pressable>
          </View>

          {currentView === "main" && renderMainView()}
          {currentView === "advanced" && renderAdvancedView()}
          {currentView === "change_address" && renderChangeAddressView()}
          {currentView === "leave_pool" && renderLeavePoolView()}
        </View>
      </View>
    </Modal>
  );
}
