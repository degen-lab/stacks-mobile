import {
  Briefcase,
  Coins,
  CreditCard,
  Gem,
  Sparkles,
  Wallet,
} from "lucide-react-native";

export const ACCOUNT_ICONS = [
  Wallet,
  Briefcase,
  Coins,
  CreditCard,
  Gem,
  Sparkles,
];

export const getAccountIcon = (accountIndex: number) =>
  ACCOUNT_ICONS[accountIndex % ACCOUNT_ICONS.length];
