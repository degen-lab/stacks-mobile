import type { AxiosError } from "axios";
import { createMutation } from "react-query-kit";

import { gameClient } from "../common";
import type {
  UpdateUserConsentApiResponse,
  UpdateUserConsentRequest,
} from "./types";

export const useUpdateUserConsent = createMutation<
  UpdateUserConsentApiResponse,
  UpdateUserConsentRequest,
  AxiosError
>({
  mutationFn: async (variables) =>
    gameClient({
      url: "user/consent",
      method: "PUT",
      data: variables,
    }).then((response) => response.data),
});
