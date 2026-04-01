import { Options, useModal } from "@/components/ui";
import type { OptionType } from "@/components/ui/select";
import {
  type ColorSchemeType,
  useSelectedTheme,
} from "@/lib/theme/use-selected-theme";

import { Item } from "./item";

const THEME_OPTIONS: OptionType[] = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
];

export function ThemeItem() {
  const modal = useModal();
  const { selectedTheme, setSelectedTheme } = useSelectedTheme();

  const selectedLabel =
    THEME_OPTIONS.find((option) => option.value === selectedTheme)?.label ??
    "System";

  const onSelect = (option: OptionType) => {
    setSelectedTheme(option.value as ColorSchemeType);
    modal.dismiss();
  };

  return (
    <>
      <Item label="Theme" value={selectedLabel} onPress={modal.present} />
      <Options
        ref={modal.ref}
        options={THEME_OPTIONS}
        onSelect={onSelect}
        value={selectedTheme}
      />
    </>
  );
}
