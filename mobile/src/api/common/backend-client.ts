import axios, { AxiosInstance } from "axios";

import { attachBackendTokenInterceptor } from "./interceptors/token";
import { attachUnauthorizedInterceptor } from "./interceptors/unauthorized";
import { BackendServiceType, getBackendServer } from "@/lib/stacks/network";

export const REQUEST_TIMEOUT = 10_000;

type ClientOptions = {
  withAuth?: boolean;
};

const attachDevLogger = (instance: AxiosInstance, serviceName: string) => {
  instance.interceptors.request.use(
    (config) => {
      console.log(
        `[${serviceName.toUpperCase()} Req] ${config.method?.toUpperCase()} ${config.url}`,
        {
          baseURL: config.baseURL,
          params: config.params,
          data: config.data,
        },
      );
      return config;
    },
    (error) => {
      console.error(`[${serviceName.toUpperCase()} Req Error]`, error);
      return Promise.reject(error);
    },
  );

  instance.interceptors.response.use(
    (response) => {
      console.log(
        `[${serviceName.toUpperCase()} Res] ${response.status} ${response.config.url}`,
        {
          data: response.data,
        },
      );
      return response;
    },
    (error) => {
      console.error(
        `[${serviceName.toUpperCase()} Res Error] ${error.response?.status} ${error.config?.url}`,
        error.message,
      );
      return Promise.reject(error);
    },
  );
};

export const createBackendClient = (
  service: BackendServiceType,
  { withAuth = false }: ClientOptions = {},
) => {
  const instance = axios.create({
    baseURL: getBackendServer(service),
    timeout: REQUEST_TIMEOUT,
  });

  if (withAuth) {
    attachBackendTokenInterceptor(instance);
    attachUnauthorizedInterceptor(instance);
  }

  if (__DEV__) {
    attachDevLogger(instance, service);
  }

  return instance;
};

export const gameClient = createBackendClient("game", { withAuth: true });
export const defiClient = createBackendClient("defi");
export const dualStackingClient = createBackendClient("dual-stacking");
export const coinPricesClient = createBackendClient("coin-prices");
