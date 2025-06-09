import { useEffect, useState } from "react";
import { useNetwork } from "@starknet-react/core";
import { getMulticallContract, parseMulticallResults } from "../utils/multicall";
import { useDeployedContractInfo } from "./useDeployedContractInfo";
import { Abi, Call } from "starknet";
import { useAccount } from "@starknet-react/core";
import { 
  ContractAbi, 
  ContractName, 
  ExtractAbiFunctionNamesScaffold,
  UseScaffoldReadConfig 
} from "~~/utils/scaffold-stark/contract";

type MultiReadCall<TAbi extends Abi, TContractName extends ContractName, TFunctionName extends ExtractAbiFunctionNamesScaffold<ContractAbi<TContractName>, "view">> = 
  UseScaffoldReadConfig<TAbi, TContractName, TFunctionName>;

export function useScaffoldMultiReadContract<
  TAbi extends Abi,
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNamesScaffold<ContractAbi<TContractName>, "view">,
  TResults extends any[] = any[]
>(
  calls: MultiReadCall<TAbi, TContractName, TFunctionName>[],
  options?: { enabled?: boolean }
): { 
  data: TResults | undefined; 
  isLoading: boolean; 
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const { chain } = useNetwork();
  const { address } = useAccount();
  const [data, setData] = useState<TResults>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!calls.length || options?.enabled === false) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get deployed contract info for each call
      const deployedContracts = await Promise.all(
        calls.map(call => useDeployedContractInfo(call.contractName))
      );

      // Prepare multicall
      const multicall = getMulticallContract(chain?.id);
      const callArray: Call[] = calls.map((call, index) => {
        const deployedContract = deployedContracts[index].data;
        if (!deployedContract) throw new Error(`Contract ${call.contractName} not found`);
        return {
          contractAddress: deployedContract.address,
          entrypoint: call.functionName,
          calldata: call.args || [],
        };
      });

      // Execute multicall
      const rawResults = await multicall.aggregate(callArray);

      // Parse results using ABIs
      const parsed = parseMulticallResults(
        rawResults,
        calls.map((call, index) => deployedContracts[index].data?.abi as Abi),
        calls.map(call => call.functionName)
      );

      setData(parsed as TResults);
    } catch (err: any) {
      setError(err);
      setData(undefined);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(calls), chain?.id, address]);

  return { 
    data, 
    isLoading, 
    error,
    refetch: fetchData
  };
}

