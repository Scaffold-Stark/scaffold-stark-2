"use client";

import { Dispatch, SetStateAction } from "react";
// import { Tuple } from "./Tuple";
// import { TupleArray } from "./TupleArray";
import {
  InputBase,
  //   AddressInput,
  //   Bytes32Input,
  //   BytesInput,
  //   InputBase,
  IntegerInput,
} from "~~/components/scaffold-stark";
// import { AbiParameterTuple } from "~~/utils/scaffold-eth/contract";
import { AbiParameter } from "~~/utils/scaffold-stark/contract";
import { displayType } from "./utilsDisplay";
import {
  isCairoBigInt,
  isCairoInt,
  isCairoU256,
} from "~~/utils/scaffold-stark";

type ContractInputProps = {
  setForm: Dispatch<SetStateAction<Record<string, any>>>;
  form: Record<string, any> | undefined;
  stateObjectKey: string;
  paramType: AbiParameter;
};

/**
 * Generic Input component to handle input's based on their function param type
 */
export const ContractInput = ({
  setForm,
  form,
  stateObjectKey,
  paramType,
}: ContractInputProps) => {
  const inputProps = {
    name: stateObjectKey,
    value: form?.[stateObjectKey],
    placeholder: paramType.name
      ? `${displayType(paramType.type)} ${paramType.name}`
      : displayType(paramType.type),
    onChange: (value: any) => {
      setForm((form) => ({
        ...form,
        [stateObjectKey]: value,
      }));
    },
  };

  const renderInput = () => {
    switch (paramType.type) {
      //   case "address":
      //     return <AddressInput {...inputProps} />;
      //   case "bytes32":
      //     return <Bytes32Input {...inputProps} />;
      //   case "bytes":
      //     return <BytesInput {...inputProps} />;
      //   case "string":
      //     return <InputBase {...inputProps} />;
      //   case "tuple":
      //     return (
      //       <Tuple
      //         setParentForm={setForm}
      //         parentForm={form}
      //         abiTupleParameter={paramType as AbiParameterTuple}
      //         parentStateObjectKey={stateObjectKey}
      //       />
      //     );
      default:
        // Handling 'int' types and 'tuple[]' types
        if (
          isCairoInt(paramType.type) ||
          isCairoBigInt(paramType.type) ||
          isCairoU256(paramType.type)
        ) {
          return <IntegerInput {...inputProps} variant={paramType.type} />;
        } else {
          return <InputBase {...inputProps} />;
        }
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center ml-2">
        {paramType.name && (
          <span className="text-xs font-medium mr-2 leading-none">
            {paramType.name}
          </span>
        )}
        <span className="block text-xs font-extralight leading-none">
          {displayType(paramType.type)}
        </span>
      </div>
      {renderInput()}
    </div>
  );
};
