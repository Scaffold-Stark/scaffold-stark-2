"use client";
import React, { useMemo, useState } from "react";
import Image from "next/image";
import { formatTimestamp } from "~~/utils/scaffold-stark/common";
import { useLocalStorage } from "usehooks-ts";
import { useHistoryStore, HistoryEntry } from "~~/services/store/history";
import { ContractName } from "~~/utils/scaffold-stark/contract";
import { getAllContracts } from "~~/utils/scaffold-stark/contractsData";
import HistoryModal from "./HistoryModal";
import { useTheme } from "next-themes";

const contractsData = getAllContracts();
const contractNames = Object.keys(contractsData) as ContractName[];

export default function DebugHistory() {
  const [selectedContract] = useLocalStorage<ContractName>(
    "scaffoldStark2.selectedContract",
    contractNames[0],
    { initializeWithValue: false },
  );
  const historyByContract = useHistoryStore((s) => s.historyByContract);
  const selectedAddress = contractsData[selectedContract]?.address as string;
  const entries = useMemo(
    () => historyByContract[selectedAddress] || [],
    [historyByContract, selectedAddress],
  );
  const [openEntry, setOpenEntry] = useState<HistoryEntry | null>(null);

  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const formatted = useMemo(
    () =>
      entries.map((e) => ({
        ...e,
        ts: new Date(e.timestamp),
      })),
    [entries],
  );

  const formatDate = (ts: number) => formatTimestamp(ts);

  const StatusIcon = ({ status }: { status: HistoryEntry["status"] }) => (
    <Image
      src={status === "success" ? "/success-icon.svg" : "/fail-icon.svg"}
      alt={status}
      width={20}
      height={20}
    />
  );

  return (
    <div className="h-full max-h-[650px] w-full xl:w-[400px] space-y-4">
      <div className="tab h-10 w-full xl:w-1/3 tab-active bg-[#8A45FC]! rounded-[5px] text-white!">
        History
      </div>
      <div className="border-gradient rounded-[5px] h-full w-full overflow-y-auto">
        <div className="flex flex-col">
          {formatted.length === 0 ? (
            <div className="p-4 text-sm text-neutral">No history yet.</div>
          ) : (
            formatted.map((e, idx) => (
              <button
                key={e.txHash ?? `${e.functionName}-${e.timestamp}`}
                className={`w-full flex items-center justify-between py-3 px-3 text-left border-b ${isDarkMode ? "bg-[#0000002E] border-b-[#ffffff4f]" : "bg-[#ffffff0f] border-b-black/40"}`}
                onClick={() => setOpenEntry(e)}
              >
                <span className="truncate mr-2 text-[#4DB4FF]">
                  {e.functionName}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral">
                    {formatDate(e.timestamp)}
                  </span>
                  <StatusIcon status={e.status} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {openEntry && (
        <HistoryModal entry={openEntry} onClose={() => setOpenEntry(null)} />
      )}
    </div>
  );
}
