import type { AxiosInstance } from "axios";

import { getBackendToken, signOut } from "@/lib/store/auth";

const UNAUTHORIZED_COOLDOWN_MS = 5_000;

export function attachUnauthorizedInterceptor(api: AxiosInstance) {
  let lastUnauthorizedAt = 0;

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const token = getBackendToken();
      if (error.response?.status === 401 && token) {
        const now = Date.now();
        if (now - lastUnauthorizedAt > UNAUTHORIZED_COOLDOWN_MS) {
          lastUnauthorizedAt = now;
          await signOut();
        }
      }

      return Promise.reject(error);
    },
  );
}
