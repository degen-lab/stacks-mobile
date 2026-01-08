export const fontConfig = {
  "InstrumentSans-Regular": require("@/assets/fonts/InstrumentSans-Regular.ttf"),
  "InstrumentSans-Medium": require("@/assets/fonts/InstrumentSans-Medium.ttf"),
  "InstrumentSans-SemiBold": require("@/assets/fonts/InstrumentSans-SemiBold.ttf"),
  "InstrumentSans-Bold": require("@/assets/fonts/InstrumentSans-Bold.ttf"),

  "DMSans-ExtraLight": require("@/assets/DMSans_18pt-ExtraLight.ttf"),

  "Matter-Regular": require("@/assets/fonts/Matter-Regular.ttf"),
  "MatterSQMono-Medium": require("@/assets/fonts/MatterSQMono-Medium.ttf"),
  "MatterMono-Regular": require("@/assets/fonts/MatterMono-Regular.ttf"),
};

// use in Tailwind/config
export const fontFamilies = {
  instrumentSans: "InstrumentSans-Regular",
  instrumentSansMedium: "InstrumentSans-Medium",
  instrumentSansSemiBold: "InstrumentSans-SemiBold",
  instrumentSansBold: "InstrumentSans-Bold",
  dmSansExtraLight: "DMSans-ExtraLight",
  matter: "Matter-Regular",
  matterSQMono: "MatterSQMono-Medium",
  matterMono: "MatterMono-Regular",
} as const;

export const getFontFamily = (fontName: keyof typeof fontFamilies) => {
  return fontFamilies[fontName];
};
