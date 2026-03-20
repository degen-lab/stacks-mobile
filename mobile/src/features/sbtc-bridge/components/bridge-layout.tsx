import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

import { ScrollView, Text, View } from "@/components/ui";

type Props = {
  title?: string;
  children: ReactNode;
  rightSlot?: ReactNode;
};

export function BridgeLayout({ title, children, rightSlot }: Props) {
  return (
    <View className="flex-1 bg-surface-tertiary">
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 32, gap: 16 }}
      >
        {title ? (
          <View className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 font-matter text-3xl text-primary">
              {title}
            </Text>
            {rightSlot ? <View>{rightSlot}</View> : null}
          </View>
        ) : null}
        {children}
      </ScrollView>
    </View>
  );
}

export function BridgeCard({
  title,
  children,
  className,
  contentClassName,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <View
      className={twMerge(
        "rounded-[20px] border border-border-secondary bg-sand-100 px-4 py-4",
        className,
      )}
    >
      {title ? (
        <Text className="mb-3 font-matter text-lg text-primary">{title}</Text>
      ) : null}
      <View className={twMerge("gap-3", contentClassName)}>{children}</View>
    </View>
  );
}
