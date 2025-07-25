import { Address } from "@starknet-react/chains";
import { useDeployedContractInfo } from "./useDeployedContractInfo";
import { useReadContract } from "@starknet-react/core";
import { BlockNumber } from "starknet";
import { Abi } from "abi-wan-kanabi";
import { formatUnits } from "ethers";

type UseScaffoldStrkBalanceProps = {
  address?: Address | string;
};

/**
 * Fetches and returns the STRK token balance for a given address.
 *
 * @param address - The address to fetch the balance for
 * @returns {Object} An object containing:
 *   - balance: The STRK token balance
 *   - isLoading: Boolean indicating if the balance is loading
 *   - error: Any error encountered
 *
 * @see https://scaffoldstark.com/docs/hooks/
 */
const useScaffoldStrkBalance = ({ address }: UseScaffoldStrkBalanceProps) => {
  const { data: deployedContract } = useDeployedContractInfo("Strk");

  const { data, ...props } = useReadContract({
    functionName: "balance_of",
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
    symbol: "STRK",
    formatted: data ? formatUnits(data as unknown as bigint) : "0",
    ...props,
  };
};

export default useScaffoldStrkBalance;
