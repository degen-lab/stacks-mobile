import type { AxiosError } from "axios";
import { createMutation } from "react-query-kit";

import { gameClient } from "../common";

type ReportUserRequest = {
  reportedUserId: number;
  reason: "inappropriate_photo" | "offensive_username" | "other";
};

type ReportUserResponse = {
  success: boolean;
  message: string;
};

export const useReportUser = createMutation<
  ReportUserResponse,
  ReportUserRequest,
  AxiosError
>({
  mutationFn: async (variables) =>
    gameClient({
      url: "user/report",
      method: "POST",
      data: variables,
    }).then((response) => response.data),
});
