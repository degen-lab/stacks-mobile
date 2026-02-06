import type { AxiosError } from "axios";
import { createMutation } from "react-query-kit";

import { dualStackingClient, queryClient } from "../../common";

type Variables = { address: string };
type Response = void;

export const useSaveTerms = createMutation<Response, Variables, AxiosError>({
  mutationFn: async (variables) => {
    await dualStackingClient.post("/save-terms", {
      address: variables.address,
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ["check-terms"],
    });
  },
});
