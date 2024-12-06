import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import { ContractName } from "~~/utils/scaffold-stark/contract";
import { Contract } from "starknet";
import { useProvider } from "@starknet-react/core";

export const useScaffoldContract = <TContractName extends ContractName>({
  contractName,
}: {
  contractName: TContractName;
}) => {
  const { data: deployedContractData, isLoading: deployedContractLoading } =
    useDeployedContractInfo(contractName);
  const { provider: publicClient } = useProvider();
  let contract = undefined;
  if (deployedContractData) {
    contract = new Contract(
      [...deployedContractData.abi],
      deployedContractData.address,
      publicClient,
    );
  }

  return {
    data: contract,
    isLoading: deployedContractLoading,
  };
};
