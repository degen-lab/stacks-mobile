import { Platform } from "react-native";

const T = Platform.OS === "ios" ? "rgba(255,255,255,0)" : "transparent";

const colors = {
  white: "#ffffff",
  black: "#000000",
  charcoal: {
    50: "#F2F2F2",
    100: "#E5E5E5",
    200: "#C9C9C9",
    300: "#B0B0B0",
    400: "#969696",
    500: "#7D7D7D",
    600: "#616161",
    700: "#474747",
    800: "#383838",
    850: "#2E2E2E",
    900: "#1E1E1E",
    950: "#121212",
  },
  neutral: {
    50: "#F7F6F5",
    100: "#F3F2F0",
    200: "#E6E4E2",
    300: "#D8D6D3",
    400: "#B7B4B0",
    500: "#95918C",
    600: "#7B7775",
    700: "#605D5D",
    800: "#484747",
    900: "#303030",
    950: "#141414",
  },
  primary: {
    50: "#FFE2CC",
    100: "#FFC499",
    200: "#FFA766",
    300: "#FF984C",
    400: "#FF8933",
    500: "#FF7B1A",
    600: "#FF6C00",
    700: "#E56100",
    800: "#CC5600",
    900: "#B24C00",
  },
  success: {
    50: "#F0FDF4",
    100: "#DCFCE7",
    200: "#BBF7D0",
    300: "#86EFAC",
    400: "#4ADE80",
    500: "#22C55E",
    600: "#16A34A",
    700: "#15803D",
    800: "#166534",
    900: "#14532D",
  },
  warning: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706",
    700: "#B45309",
    800: "#92400E",
    900: "#78350F",
  },
  danger: {
    50: "#FEF2F2",
    100: "#FEE2E2",
    200: "#FECACA",
    300: "#FCA5A5",
    400: "#F87171",
    500: "#EF4444",
    600: "#DC2626",
    700: "#B91C1C",
    800: "#991B1B",
    900: "#7F1D1D",
  },
  stacks: {
    bloodOrange: "#FC6432",
    purple: "#765BFF",
    accent: {
      100: "#FFC2A8",
      400: "#FF8A64",
    },
    borderGradientBloodOrangeCard: [
      "rgba(255, 152, 53, 1)", // start
      T, // middle transparent
      "rgba(252, 100, 50, 1)", // end
    ],
    menuStroke: ["rgba(255, 152, 53, 0.6)", "rgba(255, 255, 255, 0.6)"],
    menuFillBottom: [T, "rgba(255, 152, 53, 0.35)"],
    gameCardStroke: ["rgba(255, 255, 255, 0.6)", "rgba(252, 100, 50, 1)"],
    gameCardFillRight: [T, "rgba(252, 100, 50, 0.28)"],
  },
} as const;

export const shadows = {
  bloodOrangeCard: {
    shadowColor: "rgba(255, 152, 53, 0.5)",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.7,
    shadowRadius: 22,
    elevation: 10,
  },
};

export default colors;
