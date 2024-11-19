"use client";

import { useState, useRef, useEffect } from "react";
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
import { useReadContract } from "@starknet-react/core";
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
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);
  const lastForm = useRef(form);

  const { isFetching, data, refetch, error } = useReadContract({
    address: contractAddress,
    functionName: abiFunction.name,
    abi: [...abi],
    args: inputValue || [],
    enabled: !!inputValue,
    blockIdentifier: "pending" as BlockNumber,
  });

  useEffect(() => {
    if (error) {
      console.error(error?.message);
      console.error(error.stack);
    }
  }, [error]);

  const transformedFunction = transformAbiFunction(abiFunction);
  const inputElements = transformedFunction.inputs.map((input, inputIndex) => {
    const key = getFunctionInputKey(abiFunction.name, input, inputIndex);
    return (
      <ContractInput
        abi={abi}
        key={key}
        setForm={setForm}
        form={form}
        stateObjectKey={key}
        paramType={input}
        setFormErrorMessage={setFormErrorMessage}
      />
    );
  });

  const handleRead = () => {
    const newInputValue = getParsedContractFunctionArgs(form, false, true);

    if (JSON.stringify(form) !== JSON.stringify(lastForm.current)) {
      setInputValue(newInputValue);
      lastForm.current = form;
    }
    refetch();
  };

  return (
    <div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-1">
      <p className="text-function my-0 break-words font-medium">
        {abiFunction.name}
      </p>
      {inputElements}
      <div className="flex flex-wrap justify-between gap-2">
        <div className="w-4/5 flex-grow">
          {data !== null && data !== undefined && (
            <div className="break-words bg-input px-4 py-1.5 text-sm">
              <p className="m-0 mb-1 font-bold">Result:</p>
              <pre className="whitespace-pre-wrap break-words">
                {displayTxResult(data, false, abiFunction?.outputs)}
              </pre>
            </div>
          )}
        </div>

        <div
          className={`flex ${
            formErrorMessage &&
            "tooltip before:left-auto before:right-[-10px] before:transform-none before:content-[attr(data-tip)]"
          }`}
          data-tip={`${formErrorMessage}`}
        >
          <button
            className="bg-gradient-dark btn btn-sm border-none text-white shadow-none"
            onClick={handleRead}
            disabled={(inputValue && isFetching) || !!formErrorMessage}
          >
            {inputValue && isFetching && (
              <span className="loading loading-spinner loading-xs"></span>
            )}
            Read 📡
          </button>
        </div>
      </div>
    </div>
  );
};
