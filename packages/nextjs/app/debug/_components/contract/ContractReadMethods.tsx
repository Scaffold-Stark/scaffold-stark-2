import { Abi } from "abi-wan-kanabi";
import {
  AbiFunction,
  Contract,
  ContractName,
  GenericContract,
  InheritedFunctions,
} from "~~/utils/scaffold-stark/contract";
import { ReadOnlyFunctionForm } from "./ReadOnlyFunctionForm";

export const ContractReadMethods = ({
  deployedContractData,
}: {
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
      const isQueryableWithParams =
        fn.state_mutability === "view" && fn.inputs.length > 0;
      return isQueryableWithParams;
    })
    .map((fn) => {
      return {
        fn,
        //   inheritedFrom: (
        //     (deployedContractData as GenericContract)
        //       ?.inheritedFunctions as InheritedFunctions
        //   )?.[fn.name],
      };
    });
  //     .sort((a, b) =>
  //       b.inheritedFrom ? b.inheritedFrom.localeCompare(a.inheritedFrom) : 1
  //     );

  console.log("debug read methods");
  console.log(functionsToDisplay);
  if (!functionsToDisplay.length) {
    return <>No read methods</>;
  }
  return (
    <>
      {functionsToDisplay.map(({ fn }) => (
        <ReadOnlyFunctionForm
          abi={deployedContractData.abi as Abi}
          contractAddress={deployedContractData.address}
          abiFunction={fn}
          key={fn.name}
          //   inheritedFrom={inheritedFrom}
        />
      ))}
    </>
  );
};
