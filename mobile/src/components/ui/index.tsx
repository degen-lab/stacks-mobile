import { cssInterop } from "nativewind";
import Svg from "react-native-svg";

export * from "./button";
export * from "./checkbox";
export { default as colors } from "./colors";
export * from "./focus-aware-status-bar";
export * from "./image";
export * from "./input";
// export * from './list';
export * from "./modal";
export * from "./progress";
export * from "./select";
export * from "./icons";
export * from "./points-badge";
export * from "./streak-badge";
export * from "./screen-header";
export * from "./skeleton";
export * from "./spinner";
export * from "./loading-view";
export * from "./text";
export * from "./weekly-check-in";
export * from "./utils";
// export base components from react-native
export {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
export { SafeAreaView } from "react-native-safe-area-context";

//Apply cssInterop to Svg to resolve className string into style
cssInterop(Svg, {
  className: {
    target: "style",
  },
});
