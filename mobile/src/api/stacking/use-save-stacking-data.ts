import type { AxiosError } from "axios";
import { createMutation } from "react-query-kit";

import type {
  SaveStackingDataRequest,
  SaveStackingDataResponse,
} from "./types";
import { gameClient } from "../common";

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
  onSuccess: (data) => {
    console.log("Stacking data saved successfully:", data);
  },
  onError: (error) => {
    console.error(
      "Error saving stacking data:",
      error.response?.data || error.message,
    );
  },
});
