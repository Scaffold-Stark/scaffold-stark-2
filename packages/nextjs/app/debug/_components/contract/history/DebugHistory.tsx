"use client";
import React, { useMemo, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { useHistoryStore, HistoryEntry } from "~~/services/store/history";
import { ContractName } from "~~/utils/scaffold-stark/contract";
import { getAllContracts } from "~~/utils/scaffold-stark/contractsData";
import SuccessHistoryModal from "./SuccessHistoryModal";
import FailHistoryModal from "./FailHistoryModal";

const contractsData = getAllContracts();
const contractNames = Object.keys(contractsData) as ContractName[];

export default function DebugHistory() {
  const [selectedContract] = useLocalStorage<ContractName>(
    "scaffoldStark2.selectedContract",
    contractNames[0],
    { initializeWithValue: false },
  );
  const historyByContract = useHistoryStore((s) => s.historyByContract);
  const entries = historyByContract[selectedContract] || [];
  const [openEntry, setOpenEntry] = useState<HistoryEntry | null>(null);

  const formatted = useMemo(
    () =>
      entries.map((e) => ({
        ...e,
        ts: new Date(e.timestamp),
      })),
    [entries],
  );

  return (
    <div className="h-full max-h-[650px] w-full lg:w-[400px] space-y-4">
      <div className="tab h-10 w-full lg:w-1/3 tab-active bg-[#8A45FC]! rounded-[5px] text-white!">
        History
      </div>
      <div className="border-gradient rounded-[5px] h-full w-full p-2">
        <div className="flex flex-col divide-y divide-secondary/30">
          {formatted.length === 0 ? (
            <div className="p-4 text-sm text-neutral">No history yet.</div>
          ) : (
            formatted.map((e) => (
              <button
                key={e.txHash ?? `${e.functionName}-${e.timestamp}`}
                className="w-full flex items-center justify-between py-3 px-3 hover:bg-white/5 text-left"
                onClick={() => setOpenEntry(e)}
              >
                <span className="link truncate mr-2">{e.functionName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral">
                    {e.ts.toLocaleString(undefined, {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span
                    className={`inline-block h-4 w-4 rounded-full border ${
                      e.status === "success"
                        ? "bg-green-500/20 border-green-400"
                        : "bg-red-500/20 border-red-400"
                    }`}
                    aria-hidden
                  />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {openEntry &&
        (openEntry.status === "success" ? (
          <SuccessHistoryModal
            entry={openEntry}
            onClose={() => setOpenEntry(null)}
          />
        ) : (
          <FailHistoryModal
            entry={openEntry}
            onClose={() => setOpenEntry(null)}
          />
        ))}
    </div>
  );
}
