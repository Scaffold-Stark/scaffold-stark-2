"use client";

import { Dispatch, SetStateAction } from "react";
import { InputBase, IntegerInput } from "~~/components/scaffold-stark";
import { AbiParameter } from "~~/utils/scaffold-stark/contract";
import {
  addError,
  clearError,
  displayType,
  FormErrorMessageState,
} from "./utilsDisplay";
import {
  isCairoArray,
  isCairoBigInt,
  isCairoInt,
  isCairoOption,
  isCairoResult,
  isCairoTuple,
  isCairoType,
  isCairoU256,
  isCairoVoid,
} from "~~/utils/scaffold-stark";
import { Struct } from "./Struct";
import { Abi } from "abi-wan-kanabi";
import { ArrayInput } from "./Array";

type ContractInputProps = {
  abi?: Abi;
  setForm: Dispatch<SetStateAction<Record<string, any>>>;
  form: Record<string, any> | undefined;
  stateObjectKey: string;
  paramType: AbiParameter;
  setFormErrorMessage: Dispatch<SetStateAction<FormErrorMessageState>>;
  isDisabled?: boolean;
};

export const ContractInput = ({
  abi,
  setForm,
  form,
  stateObjectKey,
  paramType,
  setFormErrorMessage,
  isDisabled,
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
    if (isCairoArray(paramType.type)) {
      return (
        <ArrayInput
          abi={abi!}
          parentStateObjectKey={stateObjectKey}
          abiParameter={paramType}
          parentForm={form}
          setParentForm={setForm}
          setFormErrorMessage={setFormErrorMessage}
          isDisabled={isDisabled}
        />
      );
    }

    // we prio tuples here to avoid wrong input
    else if (isCairoTuple(paramType.type)) {
      return <InputBase {...inputProps} disabled={isDisabled} />;
    } else if (
      isCairoInt(paramType.type) ||
      isCairoBigInt(paramType.type) ||
      isCairoU256(paramType.type)
    ) {
      return (
        <IntegerInput
          {...inputProps}
          variant={paramType.type}
          disabled={isDisabled}
          onError={(errMessage: string | null) =>
            setFormErrorMessage((prev) => {
              if (!!errMessage)
                return addError(prev, "intError" + stateObjectKey, errMessage);
              return clearError(prev, "intError" + stateObjectKey);
            })
          }
        />
      );
    } else if (
      isCairoType(paramType.type) &&
      !isCairoResult(paramType.type) &&
      !isCairoOption(paramType.type)
    ) {
      if (isCairoVoid(paramType.type)) {
        return <></>;
      }
      return <InputBase {...inputProps} disabled={isDisabled} />;
    } else {
      return (
        <Struct
          setFormErrorMessage={setFormErrorMessage}
          abi={abi}
          parentForm={form}
          setParentForm={setForm}
          parentStateObjectKey={stateObjectKey}
          // @ts-ignore
          abiMember={abi?.find(
            // @ts-ignore
            (member) => member.name === paramType.type,
          )}
          isDisabled={isDisabled}
        />
      );
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
