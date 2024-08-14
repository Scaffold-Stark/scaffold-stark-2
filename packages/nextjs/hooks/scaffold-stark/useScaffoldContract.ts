import { useMemo } from "react";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import { ContractName } from "~~/utils/scaffold-stark/contract";
import { useTargetNetwork } from "./useTargetNetwork";
import { Contract, RpcProvider } from "starknet";
import { useAccount } from "@starknet-react/core";

export const useScaffoldContract = <TContractName extends ContractName>({
  contractName,
}: {
  contractName: TContractName;
}) => {
  const { data: deployedContractData, isLoading: deployedContractLoading } =
    useDeployedContractInfo(contractName);

  const { targetNetwork } = useTargetNetwork();
  const { account } = useAccount();
  const publicNodeUrl = targetNetwork.rpcUrls.public.http[0];

  const publicClient = useMemo(() => {
    return new RpcProvider({
      nodeUrl: publicNodeUrl,
    });
  }, [publicNodeUrl]);
  let contract = undefined;
  if (deployedContractData) {
    contract = new Contract(
      [...deployedContractData.abi],
      deployedContractData.address,
      account || publicClient,
    );

    // override call with our options
    // TODO: remove if starknet has standardized parsers for extension wallets
    const _call = contract.call;
    contract.call = function (method, args, options) {
      // TODO: incorporate parser id parseResponse is set to true
      return _call.bind(this)(method, args, {
        ...options,
        parseResponse: false,
      });
    };
  }

  return {
    data: contract,
    isLoading: deployedContractLoading,
  };
};
