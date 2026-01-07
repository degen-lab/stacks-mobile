import axios from "axios";

import { attachBackendTokenInterceptor } from "./interceptors/token";
import { attachUnauthorizedInterceptor } from "./interceptors/unauthorized";
import { getApiUrl } from "./utils";

const REQUEST_TIMEOUT = 10_000;

const client = axios.create({
  baseURL: getApiUrl(),
  timeout: REQUEST_TIMEOUT,
});

attachBackendTokenInterceptor(client);
attachUnauthorizedInterceptor(client);

// Add network logging in development for debugging
if (__DEV__) {
  client.interceptors.request.use(
    (config) => {
      console.log(
        `[Network Request] ${config.method?.toUpperCase()} ${config.url}`,
        {
          baseURL: config.baseURL,
          params: config.params,
          data: config.data,
        },
      );
      return config;
    },
    (error) => {
      console.error("[Network Request Error]", error);
      return Promise.reject(error);
    },
  );

  client.interceptors.response.use(
    (response) => {
      console.log(
        `[Network Response] ${response.config.method?.toUpperCase()} ${response.config.url}`,
        {
          status: response.status,
          data: response.data,
        },
      );
      return response;
    },
    (error) => {
      console.error(
        `[Network Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data,
        },
      );
      return Promise.reject(error);
    },
  );
}

export { client };
