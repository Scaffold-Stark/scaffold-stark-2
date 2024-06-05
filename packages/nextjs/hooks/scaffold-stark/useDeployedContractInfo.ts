import { useEffect, useState, useMemo } from "react";
import { useTargetNetwork } from "./useTargetNetwork";
import { useIsMounted } from "usehooks-ts";
import {
  ContractCodeStatus,
  ContractName,
  Contract,
  contracts,
} from "~~/utils/scaffold-stark/contract";
import { BlockIdentifier, RpcProvider } from "starknet";

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
  const publicNodeUrl = targetNetwork.rpcUrls.public.http[0];

  // Use useMemo to memoize the publicClient object
  const publicClient = useMemo(() => {
    return new RpcProvider({
      nodeUrl: publicNodeUrl,
    });
  }, [publicNodeUrl]);

  useEffect(() => {
    const checkContractDeployment = async () => {
      if (!deployedContract) {
        setStatus(ContractCodeStatus.NOT_FOUND);
        return;
      }

      let contractClasHash: string | undefined = undefined;
      try {
        contractClasHash = await publicClient.getClassHashAt(
          deployedContract.address,
          "pending" as BlockIdentifier,
        );
      } catch (error) {
        console.error(
          "⚡️ ~ file: useDeployedContractInfo.ts:useEffect ~ error",
          error,
        );
      }

      if (!isMounted()) {
        return;
      }
      // If contract code is `0x` => no contract deployed on that address
      if (contractClasHash == undefined) {
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
  };
};
