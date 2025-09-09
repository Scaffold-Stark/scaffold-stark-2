import { useEffect, useState } from "react";
import { useTargetNetwork } from "./useTargetNetwork";
import { useIsMounted } from "usehooks-ts";
import {
  ContractCodeStatus,
  ContractName,
  Contract,
  contracts,
} from "~~/utils/scaffold-stark/contract";
import { BlockIdentifier } from "starknet";
import { useProvider } from "@starknet-react/core";
import { ContractClassHashCache } from "./ContractClassHashCache";

/**
 * Checks if a contract is deployed and provides contract information.
 * This hook verifies the deployment status of a contract by checking its class hash
 * on the blockchain and returns the contract data if it's successfully deployed.
 *
 * @param contractName - The name of the contract to check for deployment
 * @returns {Object} An object containing:
 *   - data: Contract<TContractName> | undefined - The deployed contract data (address, abi, classHash) if deployed, undefined otherwise
 *   - isLoading: boolean - Boolean indicating if the deployment check is in progress
 *   - raw: Contract<TContractName> | undefined - The raw contract configuration data regardless of deployment status
 *   - status: ContractCodeStatus - The deployment status (LOADING, DEPLOYED, NOT_FOUND)
 */
export const useDeployedContractInfo = <TContractName extends ContractName>(
  contractName: TContractName,
) => {
  const isMounted = useIsMounted();
  const { targetNetwork } = useTargetNetwork();
  const deployedContract = contracts?.[targetNetwork.network]?.[
    contractName as ContractName
  ] as Contract<TContractName>;
  const [status, setStatus] = useState<ContractCodeStatus>(
    ContractCodeStatus.LOADING,
  );
  const { provider: publicClient } = useProvider();

  useEffect(() => {
    const checkContractDeployment = async () => {
      if (!deployedContract) {
        setStatus(ContractCodeStatus.NOT_FOUND);
        return;
      }

      const classHashCache = ContractClassHashCache.getInstance();
      const contractClassHash = await classHashCache.getClassHash(
        publicClient,
        deployedContract.address,
        "pre_confirmed" as BlockIdentifier,
      );

      if (!isMounted()) {
        return;
      }
      // If contract code is `0x` => no contract deployed on that address
      if (contractClassHash == undefined) {
        setStatus(ContractCodeStatus.NOT_FOUND);
        return;
      }
      setStatus(ContractCodeStatus.DEPLOYED);
    };

    checkContractDeployment();
  }, [isMounted, contractName, deployedContract, publicClient]);

  return {
    data: status === ContractCodeStatus.DEPLOYED ? deployedContract : undefined,
    isLoading: status === ContractCodeStatus.LOADING,
    raw: deployedContract,
    status,
  };
};
