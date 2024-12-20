"use client";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import { ContractName } from "~~/utils/scaffold-stark/contract";
import { Contract, Abi } from "starknet";
import { useProvider, useAccount } from "@starknet-react/core";
import { useMemo } from "react";

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
