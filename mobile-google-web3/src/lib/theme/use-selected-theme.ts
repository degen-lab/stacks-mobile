import { colorScheme, useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";

import { getString, setString } from "@/lib/storage/storage";

const SELECTED_THEME = "SELECTED_THEME";
export type ColorSchemeType = "light" | "dark" | "system";

/**
 * this hooks should only be used while selecting the theme
 * This hooks will return the selected theme which is stored in AsyncStorage
 * selectedTheme should be one of the following values 'light', 'dark' or 'system'
 * don't use this hooks if you want to use it to style your component based on the theme use useColorScheme from nativewind instead
 *
 */
export const useSelectedTheme = () => {
  const { setColorScheme } = useColorScheme();
  const [theme, setTheme] = useState<ColorSchemeType>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme from storage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await getString(SELECTED_THEME);
        if (storedTheme) {
          const themeValue = storedTheme as ColorSchemeType;
          setTheme(themeValue);
          setColorScheme(themeValue);
        }
      } catch (error) {
        console.error("Failed to load theme:", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, [setColorScheme]);

  const setSelectedTheme = React.useCallback(
    async (t: ColorSchemeType) => {
      setColorScheme(t);
      setTheme(t);
      try {
        await setString(SELECTED_THEME, t);
      } catch (error) {
        console.error("Failed to save theme:", error);
      }
    },
    [setColorScheme],
  );

  const selectedTheme = (theme ?? "system") as ColorSchemeType;
  return { selectedTheme, setSelectedTheme, isLoaded } as const;
};

// to be used in the root file to load the selected theme from AsyncStorage
export const loadSelectedTheme = async () => {
  try {
    const theme = await getString(SELECTED_THEME);
    if (theme) {
      console.log("theme", theme);
      colorScheme.set(theme as ColorSchemeType);
    }
  } catch (error) {
    console.error("Failed to load theme:", error);
  }
};
