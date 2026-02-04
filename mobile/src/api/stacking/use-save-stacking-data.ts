import type { AxiosError } from "axios";
import { createMutation } from "react-query-kit";

import { createBackendClient } from "../common/backend-client";
import type {
  SaveStackingDataRequest,
  SaveStackingDataResponse,
} from "./types";

const stackingClient = createBackendClient("dual-stacking", { withAuth: true });

type Variables = SaveStackingDataRequest;
type Response = SaveStackingDataResponse;

export const useSaveStackingDataMutation = createMutation<
  Response,
  Variables,
  AxiosError
>({
  mutationFn: async (variables) =>
    stackingClient({
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
