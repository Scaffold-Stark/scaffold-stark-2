import { Address } from "@starknet-react/chains";
import { useScaffoldContractRead } from "~~/hooks/scaffold-stark/useScaffoldContractRead";
import { useDeployedContractInfo } from "./useDeployedContractInfo";
import { useContractRead } from "@starknet-react/core";
import { useTargetNetwork } from "./useTargetNetwork";
import { BlockNumber } from "starknet";
import { Abi } from "abi-wan-kanabi";

type UseScaffoldEthBalanceProps = {
  address?: Address | string;
};

const useScaffoldEthBalance = ({ address }: UseScaffoldEthBalanceProps) => {
  const { data: deployedContract } = useDeployedContractInfo("Eth");

  const { data, ...props } = useContractRead({
    functionName: "balanceOf",
    address: deployedContract?.address,
    abi: deployedContract?.abi as Abi as any[],
    watch: true,
    enabled: true,
    args: address ? [address] : [],
    blockIdentifier: "pending" as BlockNumber,
  });
  return {
    balance: data as unknown as bigint,
    ...props,
  };
};

export default useScaffoldEthBalance;
