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
    <div className="flex min-h-0 rounded-[5px] bg-input py-0 text-sm peer-checked:rounded-b-none">
      <div className="mt-1 pl-2">
        {txResultCopied ? (
          <CheckCircleIcon
            className="ml-1.5 h-5 w-5 cursor-pointer text-xl font-normal text-sky-600"
            aria-hidden="true"
          />
        ) : (
          //@ts-ignore coponent works but some typing issue came up, ts-expect-error does not work
          <CopyToClipboard
            text={
              decodeContractResponse({
                resp: txResult,
                abi: [],
                functionOutputs: [],
                asText: true,
                showAsString: true,
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
              className="ml-1.5 h-5 w-5 cursor-pointer text-xl font-normal text-sky-600"
              aria-hidden="true"
            />
          </CopyToClipboard>
        )}
      </div>
      <div className="collapse collapse-arrow flex-wrap">
        <input type="checkbox" className="peer min-h-0" />
        <div className="custom collapse-title min-h-0 py-1.5 pl-1 text-xs">
          <strong>Transaction Receipt</strong>
        </div>
        <div className="collapse-content overflow-auto rounded-3xl rounded-t-none bg-transparent">
          <pre className="pt-4 text-xs">
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
