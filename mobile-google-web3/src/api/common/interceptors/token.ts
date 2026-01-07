import type { AxiosInstance } from "axios";

import { getBackendToken } from "@/lib/store/auth";

export function attachBackendTokenInterceptor(api: AxiosInstance) {
  api.interceptors.request.use((config) => {
    const token = getBackendToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}
