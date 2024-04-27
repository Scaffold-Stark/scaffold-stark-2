import { Address } from "@starknet-react/chains";
import { useScaffoldContractRead } from "~~/hooks/scaffold-stark/useScaffoldContractRead";

type UseScaffoldEthBalanceProps = {
  address?: Address | string;
};

const useScaffoldEthBalance = ({ address }: UseScaffoldEthBalanceProps) => {
  const { data, ...props } = useScaffoldContractRead({
    contractName: "Eth",
    functionName: "balance_of",
    args: [address as string],
  });

  return {
    balance: data as unknown as bigint,
    ...props,
  };
};

export default useScaffoldEthBalance;
