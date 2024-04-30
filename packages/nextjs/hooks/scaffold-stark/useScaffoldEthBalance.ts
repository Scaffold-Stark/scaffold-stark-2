import { Address } from "@starknet-react/chains";
import { useScaffoldContractRead } from "~~/hooks/scaffold-stark/useScaffoldContractRead";
import { useDeployedContractInfo } from "./useDeployedContractInfo";
import { useBalance, useContractRead } from "@starknet-react/core";
import { useTargetNetwork } from "./useTargetNetwork";
import { BlockNumber } from "starknet";
import { Abi } from "abi-wan-kanabi";
import { formatUnits } from "ethers";

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
    value: data as unknown as bigint,
    decimals: 18,
    symbol: "ETH",
    formatted: data ? formatUnits(data as unknown as bigint) : "0",
    ...props,
  };
};

export default useScaffoldEthBalance;
