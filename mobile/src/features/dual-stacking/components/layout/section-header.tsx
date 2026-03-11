import React, { ReactNode } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui";

type SectionProps = {
  icon?: ReactNode;
  title: string;
  children: ReactNode;
};

export default function SectionHeader({ icon, title, children }: SectionProps) {
  return (
    <View>
      <View className="mb-3 flex-row items-center gap-2 px-3">
        {icon && icon}
        <Text className="font-matter text-xl text-primary tracking-tight leading-6">
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}
