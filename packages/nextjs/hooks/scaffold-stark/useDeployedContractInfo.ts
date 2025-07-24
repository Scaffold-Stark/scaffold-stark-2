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
 * Fetches and returns deployment information for a given contract name.
 *
 * @param contractName - The name of the deployed contract
 * @returns {Object} An object containing:
 *   - data: Deployment info (address, ABI, etc.)
 *   - isLoading: Boolean indicating if data is loading
 *   - error: Any error encountered
 *
 * @see https://scaffoldstark.com/docs/hooks/
 */
export const useDeployedContractInfo = <TContractName extends ContractName>(
  contractName: TContractName
) => {
  const isMounted = useIsMounted();
  const { targetNetwork } = useTargetNetwork();
  const deployedContract = contracts?.[targetNetwork.network]?.[
    contractName as ContractName
  ] as Contract<TContractName>;
  const [status, setStatus] = useState<ContractCodeStatus>(
    ContractCodeStatus.LOADING
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
        "pending" as BlockIdentifier
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
