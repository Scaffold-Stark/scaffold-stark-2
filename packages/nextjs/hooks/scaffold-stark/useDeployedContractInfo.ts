import { useEffect, useState, useMemo } from "react";
import { useTargetNetwork } from "./useTargetNetwork";
import { useIsMounted } from "usehooks-ts";
import {
  Contract,
  ContractCodeStatus,
  ContractName,
  ContractWithAbi,
  contracts,
} from "~~/utils/scaffold-stark/contract";
import { useProvider } from "@starknet-react/core";
import { BlockIdentifier, RpcProvider } from "starknet";

export const useDeployedContractInfo = <TContractName extends ContractName>(
  contractName: TContractName
) => {
  const isMounted = useIsMounted();
  const { targetNetwork } = useTargetNetwork();
  const deployedContract = contracts?.[targetNetwork.network]?.[
    contractName as ContractName
  ] as ContractWithAbi<TContractName>;
  const [status, setStatus] = useState<ContractCodeStatus>(
    ContractCodeStatus.LOADING
  );
  const [contractWithAbi, setContractWithAbi] = useState<
    ContractWithAbi<TContractName> | undefined
  >(undefined);

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
      const contractClass = await publicClient.getClassAt(
        deployedContract.address,
        "Pending" as BlockIdentifier
      );

      if (!isMounted()) {
        return;
      }
      // If contract code is `0x` => no contract deployed on that address
      if (contractClass == undefined) {
        setStatus(ContractCodeStatus.NOT_FOUND);
        return;
      }
      const contractAbi = contractClass.abi;
      setContractWithAbi({
        ...deployedContract,
        abi: contractAbi,
      });
      setStatus(ContractCodeStatus.DEPLOYED);
    };

    checkContractDeployment();
  }, [isMounted, contractName, deployedContract, publicClient]);

  return {
    data: status === ContractCodeStatus.DEPLOYED ? contractWithAbi : undefined,
    isLoading: status === ContractCodeStatus.LOADING,
  };
};
