import React from "react";

import { View } from "@/components/ui";

type OverlayPanelProps = {
  children: React.ReactNode;
  translucent?: boolean;
};

// this is used for game overlays
export default function OverlayPanel({
  children,
  translucent = true,
}: OverlayPanelProps) {
  return (
    <View
      className={`absolute inset-0 items-center justify-center px-4 py-8 ${
        translucent ? "bg-white/85" : ""
      }`}
    >
      <View className="w-full max-w-[380px] rounded-[28px] border border-sand-200 bg-sand-100 p-6 shadow-xl dark:bg-neutral-900 dark:border-neutral-800">
        {children}
      </View>
    </View>
  );
}
