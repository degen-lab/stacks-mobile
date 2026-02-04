import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FastPoolService } from "./fast-pool";
import { walletKit } from "@/lib/stacks/wallet";
import { useSelectedNetwork } from "@/lib/store/settings";

export const useFastPool = (userAddress?: string) => {
  const queryClient = useQueryClient();
  const network = useSelectedNetwork();
  const service = new FastPoolService(walletKit, network.selectedNetwork);
  const statusQuery = useQuery({
    queryKey: ["stacking-status"],
    queryFn: () => service.getLockStatus(userAddress!),
    enabled: !!userAddress,
  });
  const allowanceQuery = useQuery({
    queryKey: ["stacking-allowance"],
    queryFn: () => service.isCallerAllowed(userAddress!),
    enabled: !!userAddress,
    refetchInterval: 30000, // Only refetch every 30 seconds
    staleTime: 20000, // Consider data fresh for 20 seconds
    retry: 2, // Only retry twice on failure
    retryDelay: 1000, // Wait 1 second between retries
  });

  const delegateMutation = useMutation({
    mutationFn: ({ amount, fee }: { amount: number; fee?: number }) =>
      service.delegate(amount, fee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stacking-status"] });
      queryClient.invalidateQueries({ queryKey: ["stacking-allowance"] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (fee?: number) => service.allowContractCaller(fee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stacking-allowance"] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: () => service.revoke(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stacking-status"] });
      queryClient.invalidateQueries({ queryKey: ["stacking-allowance"] });
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
    revoke: revokeMutation.mutate,
    revokeAsync: revokeMutation.mutateAsync,
  };
};
