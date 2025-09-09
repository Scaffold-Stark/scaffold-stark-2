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
 * Fetches STRK token balance for a given address.
 * This hook reads the balance_of function from the STRK token contract
 * and provides both raw and formatted balance values.
 *
 * @param config - Configuration object for the hook
 * @param config.address - The address to check STRK balance for (optional)
 * @returns {Object} An object containing:
 *   - value: bigint - The raw balance as bigint
 *   - decimals: number - Token decimals (18)
 *   - symbol: string - Token symbol ("STRK")
 *   - formatted: string - Formatted balance as string, defaults to "0" if no data
 *   - error: Error | null - Any error encountered during the read operation
 *   - (All other properties from useReadContract)
 * @see {@link https://scaffoldstark.com/docs/hooks/useScaffoldStrkBalance}
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
    blockIdentifier: "pre_confirmed" as BlockNumber,
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
