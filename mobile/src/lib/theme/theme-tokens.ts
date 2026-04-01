const sandPalette = {
  "--color-sand-100": "243 242 240",
  "--color-sand-200": "230 228 226",
  "--color-sand-300": "216 214 211",
  "--color-sand-400": "183 180 176",
  "--color-sand-500": "149 145 140",
  "--color-sand-600": "123 119 117",
  "--color-sand-700": "96 93 93",
  "--color-sand-800": "72 71 71",
  "--color-sand-850": "60 58 56",
  "--color-sand-900": "48 48 48",
  "--color-sand-950": "20 20 20",
} as const;

const lightSemanticTokens = {
  "--color-surface-tertiary": "247 246 245",
  "--color-surface-primary": "234 232 230",
  "--color-surface-secondary": "213 211 209",
  "--color-border-primary": "191 189 186",
  "--color-border-secondary": "213 211 209",
  "--color-text-primary": "12 12 13",
  "--color-text-secondary": "89 87 84",
  "--color-text-tertiary": "183 180 176",
} as const;

const darkSemanticTokens = {
  "--color-surface-tertiary": "24 24 24",
  "--color-surface-primary": "36 34 32",
  "--color-surface-secondary": "52 50 48",
  "--color-border-primary": "72 71 71",
  "--color-border-secondary": "52 50 48",
  "--color-text-primary": "243 242 240",
  "--color-text-secondary": "149 145 140",
  "--color-text-tertiary": "123 119 117",
} as const;

export const lightThemeTokens = {
  ...lightSemanticTokens,
  ...sandPalette,
} as const;

export const darkThemeTokens = {
  ...darkSemanticTokens,
  ...sandPalette,
} as const;

export type ThemeTokenName = keyof typeof lightThemeTokens;

export function resolveThemeTokenColor(
  theme: "light" | "dark",
  token: ThemeTokenName,
) {
  const tokens = theme === "dark" ? darkThemeTokens : lightThemeTokens;
  return `rgb(${tokens[token].replace(/ /g, ", ")})`;
}
