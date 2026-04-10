import type { AxiosError } from "axios";
import { createMutation } from "react-query-kit";

import { gameClient } from "../common";
import type { DeleteAccountApiResponse } from "./types";

export const useDeleteAccount = createMutation<
  DeleteAccountApiResponse,
  void,
  AxiosError
>({
  mutationFn: async () =>
    gameClient({
      url: "user/account",
      method: "DELETE",
    }).then((response) => response.data),
});
