import { Pressable, View } from "react-native";
import { CircleMinus, Flame, Zap } from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { Status } from "@/features/dual-stacking/types/status";
import { SealCheckIcon } from "./icons";

type StatusBadgeProps = {
  status: Status;
  onPress?: () => void;
  isCollapsed?: boolean;
};

type StatusConfig = {
  label: string;
  icon: React.ReactNode;
  bgClass: string;
  textClass: string;
  clickable: boolean;
};

const ICON_SIZE = 14;
const COLORS = {
  inactive: "#595754",
  active: "#30A46C",
};

const STATUS_CONFIG: Record<Status, StatusConfig> = {
  [Status.NotEnrolled]: {
    label: "Not enrolled",
    icon: <CircleMinus size={ICON_SIZE} color={COLORS.inactive} />,
    bgClass: "bg-surface-secondary border-border-secondary",
    textClass: "text-secondary",
    clickable: true,
  },
  [Status.Enrolled]: {
    label: "Enrolled",
    icon: <SealCheckIcon size={ICON_SIZE} color={COLORS.active} />,
    bgClass: "bg-feedback-green-150 border-feedback-green-150",
    textClass: "text-primary",
    clickable: false,
  },
  [Status.EnrolledNextCycle]: {
    label: "Enrolled next cycle",
    icon: <SealCheckIcon size={ICON_SIZE} color={COLORS.active} />,
    bgClass: "bg-feedback-green-150 border-feedback-green-150",
    textClass: "text-primary",
    clickable: false,
  },
  [Status.NotBoosting]: {
    label: "Not boosting",
    icon: <CircleMinus size={ICON_SIZE} color={COLORS.inactive} />,
    bgClass: "bg-surface-secondary border-border-secondary",
    textClass: "text-secondary",
    clickable: true,
  },
  [Status.BoostActive]: {
    label: "Boost active",
    icon: <Zap size={ICON_SIZE} color={COLORS.active} />,
    bgClass: "bg-feedback-green-150 border-feedback-green-150",
    textClass: "text-primary",
    clickable: false,
  },
  [Status.MaxBoost]: {
    label: "Max. boost",
    icon: <Flame size={ICON_SIZE} color={COLORS.active} />,
    bgClass: "bg-feedback-green-150 border-feedback-green-150",
    textClass: "text-primary",
    clickable: false,
  },
};

export function StatusBadge({
  status,
  onPress,
  isCollapsed,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG[Status.NotEnrolled];

  const className = `flex-row items-center rounded-lg border px-2 py-1 ${
    isCollapsed ? "gap-0 px-1.5" : "gap-1"
  } ${config.bgClass}`;

  const content = (
    <>
      {config.icon}
      {!isCollapsed && (
        <Text
          className={`font-instrument-sans-medium text-xs ${config.textClass}`}
        >
          {config.label}
        </Text>
      )}
    </>
  );

  if (config.clickable && onPress) {
    return (
      <Pressable
        className={className}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={config.label}
      >
        {content}
      </Pressable>
    );
  }

  return <View className={className}>{content}</View>;
}
