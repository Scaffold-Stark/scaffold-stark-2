import { Address } from "@starknet-react/chains";
import { useDeployedContractInfo } from "./useDeployedContractInfo";
import { useReadContract } from "@starknet-react/core";
import { BlockNumber } from "starknet";
import { Abi } from "abi-wan-kanabi";
import { formatUnits } from "ethers";

type UseScaffoldEthBalanceProps = {
  address?: Address | string;
};

const useScaffoldEthBalance = ({ address }: UseScaffoldEthBalanceProps) => {
  const { data: deployedContract } = useDeployedContractInfo("Eth");

  const { data, ...props } = useReadContract({
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
