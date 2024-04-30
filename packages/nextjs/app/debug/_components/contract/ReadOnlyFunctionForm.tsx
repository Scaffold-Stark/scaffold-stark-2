"use client";

import { useState, useRef } from "react";
import { Abi } from "abi-wan-kanabi";
import { Address } from "@starknet-react/chains";
import {
  displayTxResult,
  getFunctionInputKey,
  getInitialFormState,
  getParsedContractFunctionArgs,
  transformAbiFunction,
} from "~~/app/debug/_components/contract";
import { AbiFunction } from "~~/utils/scaffold-stark/contract";
import { BlockNumber } from "starknet";
import { useContractRead } from "@starknet-react/core";
import { ContractInput } from "./ContractInput";

type ReadOnlyFunctionFormProps = {
  contractAddress: Address;
  abiFunction: AbiFunction;
  abi: Abi;
};

export const ReadOnlyFunctionForm = ({
  contractAddress,
  abiFunction,
  abi,
}: ReadOnlyFunctionFormProps) => {
  const [form, setForm] = useState<Record<string, any>>(() =>
    getInitialFormState(abiFunction),
  );
  const [inputValue, setInputValue] = useState<any | undefined>(undefined);
  const lastForm = useRef(form);

  const { isFetching, data, refetch } = useContractRead({
    address: contractAddress,
    functionName: abiFunction.name,
    abi: [...abi],
    args: inputValue ? inputValue.flat() : [],
    enabled: false,
    blockIdentifier: "pending" as BlockNumber,
  });

  const transformedFunction = transformAbiFunction(abiFunction);
  const inputElements = transformedFunction.inputs.map((input, inputIndex) => {
    const key = getFunctionInputKey(abiFunction.name, input, inputIndex);
    return (
      <ContractInput
        key={key}
        setForm={setForm}
        form={form}
        stateObjectKey={key}
        paramType={input}
      />
    );
  });

  const handleRead = async () => {
    const newInputValue = getParsedContractFunctionArgs(form, true);
    if (JSON.stringify(form) === JSON.stringify(lastForm.current)) {
      await refetch();
    } else {
      setInputValue(newInputValue);
      lastForm.current = form;
    }
  };

  return (
    <div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-1">
      <p className="font-medium my-0 break-words">{abiFunction.name}</p>
      {inputElements}
      <div className="flex justify-between gap-2 flex-wrap">
        <div className="flex-grow w-4/5">
          {data !== null && data !== undefined && (
            <div className="bg-secondary rounded-3xl text-sm px-4 py-1.5 break-words">
              <p className="font-bold m-0 mb-1">Result:</p>
              <pre className="whitespace-pre-wrap break-words">
                {displayTxResult(data, false, abiFunction?.outputs)}
              </pre>
            </div>
          )}
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleRead}
          disabled={inputValue && isFetching}
        >
          {inputValue && isFetching && (
            <span className="loading loading-spinner loading-xs"></span>
          )}
          Read 📡
        </button>
      </div>
    </div>
  );
};
