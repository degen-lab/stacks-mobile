import { useMutation } from "@tanstack/react-query";
import { gameClient } from "@/api/common/backend-client";
import { Platform } from "react-native";
import type {
  CreateWidgetUrlRequest,
  CreateWidgetUrlResponse,
} from "./types";

export const useCreateTransakWidgetUrl = () => {
  return useMutation<string, Error, Omit<CreateWidgetUrlRequest, "platform">>({
    mutationFn: async (vars) => {
      const platform = Platform.OS === "ios" ? "IOS" : "ANDROID";
      const body = {
        ...vars,
        platform,
        productsAvailed: vars.productsAvailed ?? "BUY",
      };
      const response = await gameClient.post<CreateWidgetUrlResponse>(
        "/purchase/create-widget-url",
        body,
      );
      return response.data.data.widgetUrl;
    },
  });
};
