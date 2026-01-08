import { useCalendars, useLocales } from "expo-localization";

export function useI18nSettings() {
  const locales = useLocales();
  const calendars = useCalendars();

  const timeZone = calendars[0]?.timeZone ?? undefined;

  return {
    locale: locales[0]?.languageTag ?? "en-US",
    timeZone,
  };
}
