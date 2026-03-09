import { Toggle } from "@/components/ui/toggle";
import { CurrencyBtcIcon } from "@/components/ui/icons";
import colors from "@/components/ui/colors";

export type Unit = "percent" | "sbtc";

type Props = {
  value: Unit;
  onChange: (u: Unit) => void;
};

export function UnitToggle({ value, onChange }: Props) {
  return (
    <Toggle
      value={value}
      options={[
        {
          value: "percent",
          label: "APY",
          icon: (
            <CurrencyBtcIcon
              width={12}
              height={12}
              color={
                value === "percent" ? colors.neutral[50] : colors.neutral[900]
              }
            />
          ),
        },
        {
          value: "sbtc",
          label: "BTC",
          icon: (
            <CurrencyBtcIcon
              width={12}
              height={12}
              color={
                value === "sbtc" ? colors.neutral[50] : colors.neutral[900]
              }
            />
          ),
        },
      ]}
      onChange={onChange}
    />
  );
}
