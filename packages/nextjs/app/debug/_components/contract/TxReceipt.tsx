import { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { InvokeTransactionReceiptResponse } from "starknet";
import {
  CheckCircleIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import { decodeContractResponse } from "~~/app/debug/_components/contract";

export const TxReceipt = (
  txResult:
    | string
    | number
    | bigint
    | Record<string, any>
    | InvokeTransactionReceiptResponse
    | undefined,
) => {
  const [txResultCopied, setTxResultCopied] = useState(false);

  return (
    <div className="flex text-sm rounded-[5px] peer-checked:rounded-b-none min-h-0 bg-input py-0">
      <div className="mt-1 pl-2">
        {txResultCopied ? (
          <CheckCircleIcon
            className="ml-1.5 text-xl font-normal text-sky-600 h-5 w-5 cursor-pointer"
            aria-hidden="true"
          />
        ) : (
          <CopyToClipboard
            text={
              decodeContractResponse({
                resp: txResult,
                abi: [],
                functionOutputs: [],
                asText: true,
              }) as string
            }
            onCopy={() => {
              setTxResultCopied(true);
              setTimeout(() => {
                setTxResultCopied(false);
              }, 800);
            }}
          >
            <DocumentDuplicateIcon
              className="ml-1.5 text-xl font-normal text-sky-600 h-5 w-5 cursor-pointer"
              aria-hidden="true"
            />
          </CopyToClipboard>
        )}
      </div>
      <div className="flex-wrap collapse collapse-arrow">
        <input type="checkbox" className="min-h-0 peer" />
        <div className="collapse-title text-xs min-h-0 py-1.5 pl-1 custom">
          <strong>Transaction Receipt</strong>
        </div>
        <div className="collapse-content overflow-auto bg-transparent rounded-t-none rounded-3xl">
          <pre className="text-xs pt-4">
            {decodeContractResponse({
              resp: txResult,
              abi: [],
              functionOutputs: [],
              asText: true,
            })}
          </pre>
        </div>
      </div>
    </div>
  );
};
