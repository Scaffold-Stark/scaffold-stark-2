"use client";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import { ContractName } from "~~/utils/scaffold-stark/contract";
import { Contract, Abi } from "starknet";
import { useProvider, useAccount } from "@starknet-react/core";
import { useMemo } from "react";

/**
 * Provides a contract instance for interacting with deployed contracts.
 * This hook creates a Starknet contract instance with the deployed contract data,
 * automatically connects the user's account if available, and provides a fallback
 * mechanism for contract calls with response parsing.
 *
 * @param config - Configuration object for the hook
 * @param {TContractName} config.contractName - The name of the contract to get an instance for
 * @returns {Object} An object containing:
 *   - data: Contract | undefined - The contract instance with connected account and fallback call mechanism, or undefined if not deployed
 *   - isLoading: boolean - Boolean indicating if the contract data is loading
 * @see {@link https://scaffoldstark.com/docs/hooks/useScaffoldContract}
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
      publicClient,
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
