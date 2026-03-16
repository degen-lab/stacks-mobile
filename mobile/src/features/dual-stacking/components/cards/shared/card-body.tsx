import { ReactElement, ReactNode } from "react";
import { Text, View } from "react-native";

interface CardBodyProps {
  icon: ReactElement<{ className?: string }> | ReactNode;
  value: string | number;
  subtitle?: string;
  layout?: "after-value" | "inline" | "stacked";
  valueClassName?: string;
  className?: string;
}

export function CardBody({
  icon,
  value,
  subtitle,
  layout = "after-value",
  valueClassName = "text-primary", // needed for disable state
  className,
}: CardBodyProps) {
  const formatSubtitle = () => {
    if (!subtitle) return null;
    return layout !== "stacked" ? `/ ${subtitle}` : subtitle;
  };

  const stackedClassName = className ? `mt-2.5 ${className}` : "mt-2.5";

  if (layout === "stacked") {
    return (
      <View className={stackedClassName}>
        <View className="flex-row items-center gap-2">
          {icon && <View className="flex-shrink-0">{icon}</View>}
          <View>
            <Text className={`font-matter text-2xl ${valueClassName}`}>
              {value}
            </Text>
          </View>
        </View>
        {subtitle && (
          <Text className="text-secondary font-instrument-sans mt-1.5 text-sm leading-5 font-medium">
            {subtitle}
          </Text>
        )}
      </View>
    );
  }

  const inlineClassName = className
    ? `mt-2.5 flex-row items-center gap-2 ${className}`
    : "mt-2.5 flex-row items-center gap-2";

  return (
    <View className={inlineClassName}>
      {icon && <View className="shrink-0">{icon}</View>}
      <View>
        <View className="flex-row items-baseline">
          <Text className={`font-matter text-2xl ${valueClassName}`}>
            {value}
          </Text>
          {subtitle && (
            <Text className="text-secondary font-instrument-sans ml-1.5 text-sm font-medium">
              {formatSubtitle()}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
