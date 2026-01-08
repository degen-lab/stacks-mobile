import * as React from "react";

import { Pressable, Text, View } from "@/components/ui";
import { ChevronRight } from "lucide-react-native";

type ItemProps = {
  label: string;
  description?: string;
  value?: string;
  onPress?: () => void;
  icon?: React.ReactNode;
};

export const Item = ({
  label,
  description,
  value,
  icon,
  onPress,
}: ItemProps) => {
  const isPressable = onPress !== undefined;

  return (
    <Pressable
      onPress={onPress}
      pointerEvents={isPressable ? "auto" : "none"}
      className={`flex-1 flex-row items-center justify-between px-4 py-4 ${
        isPressable ? "active:bg-sand-100" : ""
      }`}
    >
      <View className="flex-1 flex-row items-center">
        {icon ? (
          <View className="mr-3 h-6 w-6 items-center justify-center">
            {icon}
          </View>
        ) : null}
        <View className="flex-1">
          <Text className="text-base font-instrument-sans text-primary">
            {label}
          </Text>
          {description ? (
            <Text className="mt-0.5 text-sm text-secondary">{description}</Text>
          ) : null}
        </View>
      </View>

      <View className="flex-row items-center">
        {value ? (
          <Text className="mr-2 text-base text-secondary">{value}</Text>
        ) : null}
        {isPressable ? (
          <ChevronRight size={18} className="text-secondary" />
        ) : null}
      </View>
    </Pressable>
  );
};
