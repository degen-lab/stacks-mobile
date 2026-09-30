import { TokenAvatar, View } from "@/components/ui";

type EarnProgramIconProps = {
  size?: "xs" | "sm" | "md" | "lg";
};

const ICON_SIZE = {
  xs: 18,
  sm: 22,
  md: 26,
  lg: 30,
} as const;

const PAIR_WIDTH_CLASS = {
  xs: "w-[34px]",
  sm: "w-10",
  md: "w-[48px]",
  lg: "w-[56px]",
} as const;

const OVERLAP = {
  xs: -4,
  sm: -5,
  md: -6,
  lg: -7,
} as const;

function StackingPair({ size }: { size: "xs" | "sm" | "md" | "lg" }) {
  const coinSize = ICON_SIZE[size];

  return (
    <View className={`${PAIR_WIDTH_CLASS[size]} shrink-0 items-start`}>
      <View className="flex-row items-center">
        <TokenAvatar
          symbol="STX"
          size={coinSize}
          style={{ marginRight: OVERLAP[size], zIndex: 1 }}
        />
        <TokenAvatar symbol="BTC" size={coinSize} />
      </View>
    </View>
  );
}

export function EarnProgramIcon({ size = "sm" }: EarnProgramIconProps) {
  return <StackingPair size={size} />;
}
