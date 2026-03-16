import { StatusBadge } from "@/components/ui/badge-with-status";
import { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { InfoTooltipIcon } from "@/components/ui/tooltip-info";
import { ChevronDown } from "lucide-react-native";
import { Status } from "@/features/dual-stacking/types/status";

interface CardHeaderProps {
  title: string;
  showTooltip?: boolean;
  tooltipContent?: ReactNode;
  status?: Status;
  onBadgeClick?: () => void;
  isCollapsible?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function CardHeader({
  title,
  showTooltip,
  tooltipContent,
  status,
  onBadgeClick,
  isCollapsible = false,
  isCollapsed = false,
  onToggleCollapse,
}: CardHeaderProps) {
  const rotation = isCollapsed ? "0deg" : "180deg";

  return (
    <View className="flex-row w-full items-center justify-between">
      <Text className="font-instrument-sans-medium text-secondary text-sm">
        {title}
      </Text>

      <View className="flex flex-row items-center gap-2 rounded-xl">
        {status && (
          <StatusBadge
            status={status}
            onPress={onBadgeClick}
            isCollapsed={isCollapsed}
          />
        )}

        {showTooltip && (
          <InfoTooltipIcon
            content={tooltipContent ?? "Additional information"}
            ariaLabel={`More information about ${title}`}
          />
        )}
        {isCollapsible && (
          <Pressable
            onPress={onToggleCollapse}
            accessibilityRole="button"
            accessibilityLabel={
              isCollapsed ? `Expand ${title}` : `Collapse ${title}`
            }
            accessibilityState={{ expanded: !isCollapsed }}
            className="h-7 w-7 bg-surface-primary items-center justify-center rounded-lg active:opacity-70"
          >
            <View
              pointerEvents="none"
              style={{ transform: [{ rotate: rotation }] }}
            >
              <ChevronDown size={16} color="#595754" />
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );
}
