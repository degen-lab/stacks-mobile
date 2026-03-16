import { ReactNode } from "react";
import { View } from "react-native";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <View
      className={`bg-sand-100 border-border-secondary items-start space-y-1 rounded-xl border py-4 pr-4 pl-6 md:min-h-30 md:min-w-74 2xl:h-full 2xl:w-full ${className || ""}`}
    >
      {children}
    </View>
  );
}
