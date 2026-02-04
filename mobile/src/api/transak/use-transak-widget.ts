import { useMutation } from "@tanstack/react-query";
import { gameClient } from "@/api/common/backend-client";
import { Platform } from "react-native";

type CreateWidgetUrlRequest = {
  cryptoCurrencyCode: string;
  fiatCurrency?: string;
  fiatAmount?: number;
  cryptoAmount?: number;
  platform: "ANDROID" | "IOS";
  walletAddress?: string;
  /** "BUY" or "SELL" – required so Transak opens the correct flow */
  productsAvailed: "BUY" | "SELL";
};

type CreateWidgetUrlResponse = {
  success: boolean;
  message: string;
  data: {
    widgetUrl: string;
  };
};

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
