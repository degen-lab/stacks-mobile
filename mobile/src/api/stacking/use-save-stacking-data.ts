import type { AxiosError } from "axios";
import { createMutation } from "react-query-kit";

import type {
  SaveStackingDataRequest,
  SaveStackingDataResponse,
} from "./types";
import { gameClient, queryClient } from "../common";

type Variables = SaveStackingDataRequest;
type Response = SaveStackingDataResponse;

export const useSaveStackingDataMutation = createMutation<
  Response,
  Variables,
  AxiosError
>({
  mutationFn: async (variables) =>
    gameClient({
      url: "stacking/save",
      method: "POST",
      data: variables,
    }).then((response) => response.data),
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ["stacking-user-data"],
    });
  },
  onError: (error) => {
    console.error(
      "Error saving stacking data:",
      error.response?.data || error.message,
    );
  },
});
