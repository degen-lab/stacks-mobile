export const getContractDetails = (contractId: string) => {
  const [address, name] = contractId.split(".");
  return { address, name };
};
