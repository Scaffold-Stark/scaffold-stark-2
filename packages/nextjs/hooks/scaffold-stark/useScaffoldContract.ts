"use client";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import { ContractName } from "~~/utils/scaffold-stark/contract";
import { Contract, Abi } from "starknet";
import { useProvider, useAccount } from "@starknet-react/core";
import { useMemo } from "react";

/**
 * Provides contract instance and ABI for a given contract name.
 *
 * @param contractName - The deployed contract name
 * @returns {Object} An object containing:
 *   - contract: The contract instance
 *   - abi: The contract ABI
 *   - address: The contract address
 *   - isLoading: Boolean indicating if contract data is loading
 *   - error: Any error encountered
 *
 * @see https://scaffoldstark.com/docs/hooks/
 */
export const useScaffoldContract = <TContractName extends ContractName>({
  contractName,
}: {
  contractName: TContractName;
}) => {
  const { data: deployedContractData, isLoading: deployedContractLoading } =
    useDeployedContractInfo(contractName);

  const { provider: publicClient } = useProvider();
  const { account } = useAccount();

  const contract = useMemo(() => {
    if (!deployedContractData) return undefined;

    const contractInstance = new Contract(
      deployedContractData.abi as Abi,
      deployedContractData.address,
      publicClient
    );

    if (account) {
      contractInstance.connect(account);
    }

    const originalCall = contractInstance.call.bind(contractInstance);
    contractInstance.call = async (method: string, ...args: any[]) => {
      try {
        return await originalCall(method, ...args, { parseResponse: false });
      } catch (error) {
        return originalCall(method, ...args);
      }
    };

    return contractInstance;
  }, [deployedContractData, publicClient, account]);

  return {
    data: contract,
    isLoading: deployedContractLoading,
  };
};
