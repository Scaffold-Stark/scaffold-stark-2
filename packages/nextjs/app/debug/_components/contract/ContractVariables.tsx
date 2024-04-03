import { Abi } from "abi-wan-kanabi";
import {
  AbiFunction,
  Contract,
  ContractName,
  GenericContract,
  InheritedFunctions,
} from "~~/utils/scaffold-stark/contract";
import { DisplayVariable } from "./DisplayVariable";

export const ContractVariables = ({
  refreshDisplayVariables,
  deployedContractData,
}: {
  refreshDisplayVariables: boolean;
  deployedContractData: Contract<ContractName>;
}) => {
  if (!deployedContractData) {
    return null;
  }

  const functionsToDisplay = ((deployedContractData.abi || []) as Abi)
    .reduce((acc, part) => {
      if (part.type === "function") {
        acc.push(part);
      } else if (part.type === "interface" && Array.isArray(part.items)) {
        part.items.forEach((item) => {
          if (item.type === "function") {
            acc.push(item);
          }
        });
      }
      return acc;
    }, [] as AbiFunction[])
    .filter((fn) => {
      const isQueryableWithNoParams =
        fn.state_mutability === "view" && fn.inputs.length === 0;
      return isQueryableWithNoParams;
    })
    .map((fn) => {
      return {
        fn,
        // inheritedFrom: (
        //   (deployedContractData as GenericContract)
        //     ?.inheritedFunctions as InheritedFunctions
        // )?.[fn.name],
      };
    });
  // .sort((a, b) =>
  //   b.inheritedFrom ? b.inheritedFrom.localeCompare(a.inheritedFrom) : 1
  // );

  if (!functionsToDisplay.length) {
    return <>No contract variables</>;
  }

  return (
    <>
      {functionsToDisplay.map(({ fn }) => (
        <DisplayVariable
          abi={deployedContractData.abi as Abi}
          abiFunction={fn}
          contractAddress={deployedContractData.address}
          key={fn.name}
          refreshDisplayVariables={refreshDisplayVariables}
          //   inheritedFrom={inheritedFrom}
        />
      ))}
    </>
  );
};
