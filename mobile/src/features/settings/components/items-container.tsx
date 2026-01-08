import React from "react";

import { Text, View } from "@/components/ui";

type Props = {
  children: React.ReactNode;
  title?: string;
};

export const ItemsContainer = ({ children, title }: Props) => {
  const childrenArray = React.Children.toArray(children);

  return (
    <View className="mb-6">
      {title ? (
        <Text className="pb-3 pt-2 text-xs font-instrument-sans-medium uppercase tracking-wide text-secondary">
          {title}
        </Text>
      ) : null}
      <View className="overflow-hidden rounded-xl border border-surface-secondary bg-white">
        {childrenArray.map((child, index) => (
          <React.Fragment key={index}>
            {child}
            {index < childrenArray.length - 1 ? (
              <View className="mx-4 border-b border-surface-secondary" />
            ) : null}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};
