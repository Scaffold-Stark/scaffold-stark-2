import { Abi } from "abi-wan-kanabi";
import {
  Contract,
  ContractName,
  getFunctionsByStateMutability,
} from "~~/utils/scaffold-stark/contract";
import { DisplayVariable } from "./DisplayVariable";

export const ContractVariables = ({
  refreshDisplayVariables,
  deployedContractData,
  contractName,
}: {
  refreshDisplayVariables: boolean;
  deployedContractData: Contract<ContractName>;
  contractName: ContractName;
}) => {
  if (!deployedContractData) {
    return null;
  }

  const functionsToDisplay = getFunctionsByStateMutability(
    (deployedContractData.abi || []) as Abi,
    "view",
  )
    .filter((fn) => {
      const isQueryableWithParams = fn.inputs.length === 0;
      return isQueryableWithParams;
    })
    .map((fn) => {
      return {
        fn,
      };
    });
  if (!functionsToDisplay.length) {
    return <>No contract variables</>;
  }

  return (
    <>
      {functionsToDisplay.map(({ fn }) => (
        <DisplayVariable
          abiFunction={fn}
          contractName={contractName}
          key={fn.name}
          refreshDisplayVariables={refreshDisplayVariables}
        />
      ))}
    </>
  );
};
