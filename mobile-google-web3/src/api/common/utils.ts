import { Env } from "@env";
import { Platform } from "react-native";

export const getApiUrl = (): string => {
  const apiUrl = Env.API_URL;

  if (!apiUrl) {
    return "";
  }
  // On Android emulator, replace localhost/127.0.0.1 with 10.0.2.2
  if (Platform.OS === "android" && __DEV__) {
    return apiUrl.replace(/localhost|127\.0\.0\.1/g, "10.0.2.2");
  }

  return apiUrl;
};
