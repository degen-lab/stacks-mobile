import type { AxiosError } from "axios";
import { createMutation } from "react-query-kit";

import { client } from "../../common";
import { queryClient } from "../../common/api-provider";
import type { UserProfile } from "../../user/types";
import type {
  SubmitGameSessionRequest,
  SubmitGameSessionResponse,
} from "./types";

type Variables = SubmitGameSessionRequest;
type Response = SubmitGameSessionResponse;

export const useValidateSessionMutation = createMutation<
  Response,
  Variables,
  AxiosError
>({
  mutationFn: async (variables) =>
    client({
      url: "session/validate",
      method: "POST",
      data: variables,
    }).then((response) => response.data),
  onSuccess: (response) => {
    const totalPoints = response.data?.totalPoints;
    if (totalPoints !== undefined) {
      queryClient.setQueryData<UserProfile>(["user-profile"], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          points: totalPoints,
        };
      });
    }
  },
});
