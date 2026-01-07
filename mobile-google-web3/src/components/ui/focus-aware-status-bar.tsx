import { useIsFocused } from "@react-navigation/native";
import { useColorScheme } from "nativewind";
import { Platform } from "react-native";
import { SystemBars } from "react-native-edge-to-edge";

type Props = { hidden?: boolean };

export const FocusAwareStatusBar = ({ hidden = false }: Props) => {
  const { colorScheme } = useColorScheme();
  const isFocused = useIsFocused();

  if (Platform.OS === "web") return null;

  return isFocused ? (
    <SystemBars
      style={colorScheme === "light" ? "dark" : "light"}
      hidden={hidden}
    />
  ) : null;
};

FocusAwareStatusBar.displayName = "FocusAwareStatusBar";
