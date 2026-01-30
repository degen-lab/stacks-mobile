import axios from "axios";

import { getStacksApiBase } from "@/lib/stacks/network";
import { REQUEST_TIMEOUT } from "./backend-client";

export const stacksApiClient = axios.create({
  baseURL: getStacksApiBase(),
  timeout: REQUEST_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});
if (__DEV__) {
  stacksApiClient.interceptors.request.use((config) => {
    console.log(`[Stacks Node] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  });
}
