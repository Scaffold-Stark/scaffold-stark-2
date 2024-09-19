"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ContractInput,
  //   TxReceipt,
  getFunctionInputKey,
  getInitialFormState,
  getParsedContractFunctionArgs,
  transformAbiFunction,
} from "~~/app/debug/_components/contract";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";
import {
  useSendTransaction,
  useNetwork,
  useTransactionReceipt,
} from "@starknet-react/core";
import { Abi } from "abi-wan-kanabi";
import { AbiFunction } from "~~/utils/scaffold-stark/contract";
import { Address } from "@starknet-react/chains";
import { InvokeTransactionReceiptResponse } from "starknet";
import { TxReceipt } from "./TxReceipt";
import { useTransactor } from "~~/hooks/scaffold-stark";
import { useAccount } from "~~/hooks/useAccount";

type WriteOnlyFunctionFormProps = {
  abi: Abi;
  abiFunction: AbiFunction;
  onChange: () => void;
  contractAddress: Address;
  //   inheritedFrom?: string;
};

export const WriteOnlyFunctionForm = ({
  abi,
  abiFunction,
  onChange,
  contractAddress,
}: WriteOnlyFunctionFormProps) => {
  const [form, setForm] = useState<Record<string, any>>(() =>
    getInitialFormState(abiFunction),
  );
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);
  const { status: walletStatus, isConnected, account, chainId } = useAccount();
  const { chain } = useNetwork();
  const writeTxn = useTransactor();
  const { targetNetwork } = useTargetNetwork();

  const writeDisabled = useMemo(
    () =>
      !chain ||
      chain?.network !== targetNetwork.network ||
      walletStatus === "disconnected",
    [chain, targetNetwork.network, walletStatus],
  );

  const {
    data: result,
    isPending: isLoading,
    sendAsync,
    error,
  } = useSendTransaction({
    calls: [
      {
        contractAddress,
        entrypoint: abiFunction.name,

        // use infinity to completely flatten array from n dimensions to 1 dimension
        // writing in starknet next still needs rawArgs parsing, use v2 parsing
        calldata: getParsedContractFunctionArgs(form, false).flat(Infinity),
      },
    ],
  });

  // side effect for error logging
  useEffect(() => {
    if (error) {
      console.error(error?.message);
      console.error(error.stack);
    }
  }, [error]);

  const handleWrite = async () => {
    if (sendAsync) {
      try {
        const makeWriteWithParams = () => sendAsync();
        await writeTxn(makeWriteWithParams);
        onChange();
      } catch (e: any) {
        const errorPattern = /Contract (.*?)"}/;
        const match = errorPattern.exec(e.message);
        const message = match ? match[1] : e.message;

        console.error(
          "⚡️ ~ file: WriteOnlyFunctionForm.tsx:handleWrite ~ error",
          message,
        );
      }
    }
  };

  const [displayedTxResult, setDisplayedTxResult] =
    useState<InvokeTransactionReceiptResponse>();
  const { data: txResult } = useTransactionReceipt({
    hash: result?.transaction_hash,
  });
  useEffect(() => {
    setDisplayedTxResult(txResult as InvokeTransactionReceiptResponse);
  }, [txResult]);

  // TODO use `useMemo` to optimize also update in ReadOnlyFunctionForm
  const transformedFunction = transformAbiFunction(abiFunction);
  const inputs = transformedFunction.inputs.map((input, inputIndex) => {
    const key = getFunctionInputKey(abiFunction.name, input, inputIndex);
    return (
      <ContractInput
        abi={abi}
        key={key}
        setForm={(updatedFormValue) => {
          setDisplayedTxResult(undefined);
          setForm(updatedFormValue);
        }}
        form={form}
        stateObjectKey={key}
        paramType={input}
        setFormErrorMessage={setFormErrorMessage}
      />
    );
  });
  const zeroInputs = inputs.length === 0;

  const errorMsg = (() => {
    if (writeDisabled) return "Wallet not connected or on wrong network";
    return formErrorMessage;
  })();

  return (
    <div className="py-5 space-y-3 first:pt-0 last:pb-1">
      <div
        className={`flex gap-3 ${
          zeroInputs ? "flex-row justify-between items-center" : "flex-col"
        }`}
      >
        <p className="font-medium my-0 break-words text-function">
          {abiFunction.name}
          {/* <InheritanceTooltip inheritedFrom={undefined} /> */}
        </p>
        {inputs}
        <div className="flex justify-between gap-2">
          {!zeroInputs && (
            <div className="flex-grow basis-0">
              {displayedTxResult ? (
                <TxReceipt txResult={displayedTxResult} />
              ) : null}
            </div>
          )}
          <div
            className={`flex ${
              !!errorMsg &&
              "tooltip before:content-[attr(data-tip)] before:right-[-10px] before:left-auto before:transform-none"
            }`}
            data-tip={`${errorMsg}`}
          >
            <button
              className="btn bg-gradient-dark btn-sm shadow-none border-none text-white"
              disabled={writeDisabled || !!formErrorMessage || isLoading}
              onClick={handleWrite}
            >
              {isLoading && (
                <span className="loading loading-spinner loading-xs"></span>
              )}
              Send 💸
            </button>
          </div>
        </div>
      </div>
      {zeroInputs && txResult ? (
        <div className="flex-grow basis-0">
          <TxReceipt txResult={txResult} />
        </div>
      ) : null}
    </div>
  );
};
