import axios from "axios";

import { getHiroApiBase } from "@/lib/stacks/network";
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
