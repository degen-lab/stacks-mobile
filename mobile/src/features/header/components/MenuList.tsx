import React from "react";
import { twMerge } from "tailwind-merge";

import { View } from "@/components/ui";
import { MenuItem, type MenuItemProps } from "./MenuItem";

type MenuListProps = {
  items: MenuItemProps[];
  className?: string;
};

export function MenuList({ items, className = "" }: MenuListProps) {
  return (
    <View
      className={twMerge(
        "overflow-hidden rounded-3xl border border-sand-200 bg-white",
        className,
      )}
    >
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          <MenuItem {...item} />
          {index < items.length - 1 ? (
            <View className="h-px bg-sand-200" />
          ) : null}
        </React.Fragment>
      ))}
    </View>
  );
}
