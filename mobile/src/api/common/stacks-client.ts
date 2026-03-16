import axios from "axios";

import { getHiroApiBase, getStacksDegenApiBase } from "@/lib/stacks/network";
import { REQUEST_TIMEOUT } from "./backend-client";

export const hiroApiClient = axios.create({
  baseURL: getHiroApiBase(),
  timeout: REQUEST_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});
hiroApiClient.interceptors.request.use((config) => {
  config.baseURL = getHiroApiBase();
  if (__DEV__) {
    console.log(`[Stacks Node] ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

export const stacksApiDegenClient = axios.create({
  baseURL: getStacksDegenApiBase(),
  timeout: REQUEST_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});
if (__DEV__) {
  stacksApiDegenClient.interceptors.request.use((config) => {
    console.log(`[Degen API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  });
}
