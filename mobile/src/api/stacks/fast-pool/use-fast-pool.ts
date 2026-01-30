import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FastPoolService } from "./fast-pool";
import { walletKit } from "@/lib/stacks/wallet";
import { useSelectedNetwork } from "@/lib/store/settings";

export const useFastPool = (userAddress?: string) => {
  const queryClient = useQueryClient();
  const network = useSelectedNetwork();
  const service = new FastPoolService(walletKit, network.selectedNetwork);
  const statusQuery = useQuery({
    queryKey: ["stacking", "status", userAddress, network],
    queryFn: () => service.getLockStatus(userAddress!),
    enabled: !!userAddress,
  });
  const allowanceQuery = useQuery({
    queryKey: ["stacking", "allowance", userAddress, network],
    queryFn: () => service.isCallerAllowed(userAddress!),
    enabled: !!userAddress,
  });

  const delegateMutation = useMutation({
    mutationFn: (amount: number) => service.delegate(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stacking"] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => service.allowContractCaller(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stacking", "allowance"] });
    },
  });

  return {
    status: statusQuery.data,
    isAllowed: allowanceQuery.data,
    isLoading: statusQuery.isLoading || allowanceQuery.isLoading,
    delegate: delegateMutation.mutate,
    delegateAsync: delegateMutation.mutateAsync,
    approve: approveMutation.mutate,
    approveAsync: approveMutation.mutateAsync,
  };
};
