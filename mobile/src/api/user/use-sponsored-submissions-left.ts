import type { AxiosError } from "axios";
import { createQuery } from "react-query-kit";

import { client } from "../common";
import type {
  SponsoredSubmissionsLeft,
  SponsoredSubmissionsLeftApiResponse,
} from "./types";

type Response = SponsoredSubmissionsLeft;
type Variables = void;

export const useSponsoredSubmissionsLeft = createQuery<
  Response,
  Variables,
  AxiosError
>({
  queryKey: ["sponsored-submissions-left"],
  fetcher: async () => {
    const response = await client.get<SponsoredSubmissionsLeftApiResponse>(
      "user/sponsored-submissions-left",
    );
    return response.data.data;
  },
});
