import { Abi } from "abi-wan-kanabi";
import { WriteOnlyFunctionForm } from "~~/app/debug/_components/contract";
import {
  AbiFunction,
  Contract,
  ContractName,
  GenericContract,
  InheritedFunctions,
} from "~~/utils/scaffold-stark/contract";

export const ContractWriteMethods = ({
  onChange,
  deployedContractData,
}: {
  onChange: () => void;
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
      const isWriteableFunction = fn.state_mutability == "external";
      return isWriteableFunction;
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
    return <>No write methods</>;
  }

  return (
    <>
      {functionsToDisplay.map(({ fn }, idx) => (
        <WriteOnlyFunctionForm
          abi={deployedContractData.abi as Abi}
          key={`${fn.name}-${idx}}`}
          abiFunction={fn}
          onChange={onChange}
          contractAddress={deployedContractData.address}
          //   inheritedFrom={inheritedFrom}
        />
      ))}
    </>
  );
};
