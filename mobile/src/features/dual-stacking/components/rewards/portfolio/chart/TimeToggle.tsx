import { Toggle, ToggleOption } from "@/components/ui/toggle";
import type { TimePeriod } from "./types";

type Props = {
  value: TimePeriod;
  options?: TimePeriod[];
  onChange: (p: TimePeriod) => void;
};

const DEFAULTS: TimePeriod[] = [90, 30, 15];

export function TimeToggle({ value, options = DEFAULTS, onChange }: Props) {
  const toggleOptions: ToggleOption<string>[] = options.map((p) => ({
    value: String(p),
    label: `${p}d`,
  }));

  return (
    <Toggle
      value={String(value)}
      options={toggleOptions}
      onChange={(v) => onChange(Number(v) as TimePeriod)}
    />
  );
}
