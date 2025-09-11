import React from "react";
import Link from "next/link";
import { Address } from "~~/components/scaffold-stark";
import { TxnEntry, truncateHash } from "~~/utils/blockexplorer";
import { CopyButton } from "./CopyButton";
import { StatusBadge } from "./StatusBadge";
import { TypeBadge } from "./TypeBadge";

interface TransactionTableProps {
  transactions: TxnEntry[];
  copiedHash: string | null;
  onCopyHash: (hash: string) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  copiedHash,
  onCopyHash,
}) => (
  <div className="bg-base-100 rounded-lg shadow-lg overflow-hidden border border-base-300">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-base-200/50 border-b border-base-300">
            <th className="text-left py-4 px-4 font-semibold text-base-content">
              Transaction Hash
            </th>
            <th className="text-left py-4 px-4 font-semibold text-base-content">
              Block Number
            </th>
            <th className="text-left py-4 px-4 font-semibold text-base-content">
              Status
            </th>
            <th className="text-left py-4 px-4 font-semibold text-base-content">
              Type
            </th>
            <th className="text-left py-4 px-4 font-semibold text-base-content">
              Calls
            </th>
            <th className="text-left py-4 px-4 font-semibold text-base-content">
              Address
            </th>
            <th className="text-left py-4 px-4 font-semibold text-base-content">
              Age
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, index) => (
            <tr
              key={tx.hash}
              className="border-b border-base-300 hover:bg-base-200/30 transition-colors"
            >
              <td className="py-4 px-4">
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/blockexplorer/tx/${tx.hash}`}
                    className="text-sm font-mono text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    {truncateHash(tx.hash)}
                  </Link>
                  <CopyButton
                    text={tx.hash}
                    fieldName="hash"
                    copiedField={copiedHash}
                    onCopy={onCopyHash}
                  />
                </div>
              </td>
              <td className="py-4 px-4">
                <span className="text-blue-500 hover:text-blue-600 cursor-pointer">
                  {tx.blockNumber}
                </span>
              </td>
              <td className="py-4 px-4">
                <StatusBadge status={tx.status} />
              </td>
              <td className="py-4 px-4">
                <TypeBadge type={tx.type} />
              </td>
              <td className="py-4 px-4">
                <span className="text-sm text-base-content/80">
                  {tx.calls
                    .map((call) =>
                      call.length > 20 ? `${call.slice(0, 15)}...` : call,
                    )
                    .join(", ")}
                </span>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center space-x-1">
                  {tx.from ? (
                    <Address address={tx.from as `0x${string}`} size="sm" />
                  ) : (
                    <span className="text-sm text-base-content/80">N/A</span>
                  )}
                </div>
              </td>
              <td className="py-4 px-4">
                <span className="text-sm text-base-content/80">{tx.age}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
