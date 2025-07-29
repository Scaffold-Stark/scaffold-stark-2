"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ContractInput,
  //   TxReceipt,
  getFunctionInputKey,
  getInitialFormState,
  getArgsAsStringInputFromForm,
  transformAbiFunction,
  FormErrorMessageState,
  getTopErrorMessage,
  isError,
} from "~~/app/debug/_components/contract";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";
import { useNetwork, useContract } from "@starknet-react/core";
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
  const [formErrorMessage, setFormErrorMessage] =
    useState<FormErrorMessageState>({});
  const { status: walletStatus, isConnected, account, chainId } = useAccount();
  const { chain } = useNetwork();
  const {
    writeTransaction,
    transactionReceiptInstance,
    sendTransactionInstance,
  } = useTransactor();
  const { data: txResult } = transactionReceiptInstance;
  const { targetNetwork } = useTargetNetwork();

  const writeDisabled = useMemo(
    () =>
      !chain ||
      chain?.network !== targetNetwork.network ||
      walletStatus === "disconnected",
    [chain, targetNetwork.network, walletStatus],
  );

  const { contract: contractInstance } = useContract({
    abi,
    address: contractAddress,
  });

  const { isPending: isLoading, error } = sendTransactionInstance;

  // side effect for error logging
  useEffect(() => {
    if (error) {
      console.error(error?.message);
      console.error(error.stack);
    }
  }, [error]);

  const handleWrite = async () => {
    try {
      await writeTransaction(
        !!contractInstance
          ? [
              contractInstance.populate(
                abiFunction.name,
                getArgsAsStringInputFromForm(form),
              ),
            ]
          : [],
      );
    } catch (e: any) {
      const errorPattern = /Contract (.*?)"}/;
      const match = errorPattern.exec(e.message);
      const message = match ? match[1] : e.message;

      console.error(
        "⚡️ ~ file: WriteOnlyFunctionForm.tsx:handleWrite ~ error",
        message,
      );
    }
  };

  const [displayedTxResult, setDisplayedTxResult] =
    useState<InvokeTransactionReceiptResponse>();
  useEffect(() => {
    setDisplayedTxResult(
      txResult as unknown as InvokeTransactionReceiptResponse,
    );
    onChange();
  }, [txResult, onChange]);

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
    return getTopErrorMessage(formErrorMessage);
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
            <div className="grow basis-0">
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
              disabled={writeDisabled || isError(formErrorMessage) || isLoading}
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
        <div className="grow basis-0">
          <TxReceipt txResult={txResult} />
        </div>
      ) : null}
    </div>
  );
};
