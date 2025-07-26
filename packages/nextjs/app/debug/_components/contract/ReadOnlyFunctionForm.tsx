"use client";

import { useState, useRef, useEffect } from "react";
import { Abi } from "abi-wan-kanabi";
import { Address } from "@starknet-react/chains";
import {
  getFunctionInputKey,
  getInitialFormState,
  getArgsAsStringInputFromForm,
  transformAbiFunction,
  FormErrorMessageState,
  isError,
  getTopErrorMessage,
  decodeContractResponse,
} from "~~/app/debug/_components/contract";
import { AbiFunction } from "~~/utils/scaffold-stark/contract";
import { BlockNumber } from "starknet";
import { useContract, useReadContract } from "@starknet-react/core";
import { ContractInput } from "./ContractInput";
import { isValidContractArgs } from "~~/utils/scaffold-stark/common";

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
  const [formErrorMessage, setFormErrorMessage] =
    useState<FormErrorMessageState>({});
  const lastForm = useRef(form);

  const { contract: contractInstance } = useContract({
    abi,
    address: contractAddress,
  });

  const inputIsValidArray = isValidContractArgs(
    inputValue,
    abiFunction.inputs.length,
  );

  const { isFetching, data, refetch, error } = useReadContract({
    address: contractAddress,
    functionName: abiFunction.name,
    abi: [...abi],
    args: inputIsValidArray ? inputValue : undefined,
    enabled: !!inputValue && !!contractInstance,
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
    const newInputValue = getArgsAsStringInputFromForm(form);
    const expectedArgCount = abiFunction.inputs.length;

    const isValidInput = isValidContractArgs(newInputValue, expectedArgCount);

    if (!isValidInput) {
      /**
       * Todo: add extra logging in future release.
       */
      console.warn(
        `Read blocked: Expected ${expectedArgCount} args, got ${newInputValue.length}`,
      );
      return;
    }

    if (JSON.stringify(form) !== JSON.stringify(lastForm.current)) {
      setInputValue(newInputValue);
      lastForm.current = form;
    }

    refetch();
  };

  return (
    <div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-1">
      <p className="font-medium my-0 break-words text-function">
        {abiFunction.name}
      </p>
      {inputElements}
      <div className="flex justify-between gap-2 flex-wrap">
        <div className="grow w-4/5">
          {data !== null && data !== undefined && (
            <div className="bg-input text-sm px-4 py-1.5 break-words">
              <p className="font-bold m-0 mb-1">Result:</p>
              <pre className="whitespace-pre-wrap break-words">
                {decodeContractResponse({
                  resp: data,
                  abi,
                  functionOutputs: abiFunction?.outputs,
                  asText: true,
                })}
              </pre>
            </div>
          )}
        </div>

        <div
          className={`flex ${
            isError(formErrorMessage) &&
            "tooltip before:content-[attr(data-tip)] before:right-[-10px] before:left-auto before:transform-none"
          }`}
          data-tip={`${getTopErrorMessage(formErrorMessage)}`}
        >
          <button
            className="btn bg-gradient-dark btn-sm shadow-none border-none text-white"
            onClick={handleRead}
            disabled={(inputValue && isFetching) || isError(formErrorMessage)}
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
