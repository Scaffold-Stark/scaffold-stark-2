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

type FilterChip = "All" | "Read" | "Write" | "Success" | "Error";

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function entriesToCSV(entries: HistoryEntry[]): string {
  const headers =
    "timestamp,callType,functionName,status,txHash,input,message,decodedResult,gasUsed,duration,errorDetails";
  const escape = (val: string | number | undefined) => {
    if (val === undefined || val === null) return "";
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };
  const rows = entries.map((e) =>
    [
      escape(e.timestamp),
      escape(e.callType),
      escape(e.functionName),
      escape(e.status),
      escape(e.txHash),
      escape(e.input),
      escape(e.message),
      escape(e.decodedResult),
      escape(e.gasUsed),
      escape(e.duration),
      escape(e.errorDetails),
    ].join(","),
  );
  return [headers, ...rows].join("\n");
}

const StatusIcon = ({ status }: { status: HistoryEntry["status"] }) => (
  <Image
    src={status === "success" ? "/success-icon.svg" : "/fail-icon.svg"}
    alt={status}
    width={16}
    height={16}
  />
);

export default function DebugHistory() {
  const [selectedContract] = useLocalStorage<ContractName>(
    "scaffoldStark2.selectedContract",
    contractNames[0],
    { initializeWithValue: false },
  );
  const historyByContract = useHistoryStore((s) => s.historyByContract);
  const clearHistory = useHistoryStore((s) => s.clearHistory);
  const selectedAddress = (
    contractsData as Record<string, { address: string }>
  )[selectedContract as string]?.address as string;
  const entries = useMemo(
    () => historyByContract[selectedAddress] || [],
    [historyByContract, selectedAddress],
  );
  const [openEntry, setOpenEntry] = useState<HistoryEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<FilterChip[]>([]);

  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const toggleFilter = (chip: FilterChip) => {
    if (chip === "All") {
      setActiveFilters([]);
      return;
    }
    setActiveFilters((prev) =>
      prev.includes(chip) ? prev.filter((f) => f !== chip) : [...prev, chip],
    );
  };

  const formatted = useMemo(() => {
    let result = entries.map((e) => ({ ...e, ts: new Date(e.timestamp) }));

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((e) =>
        e.functionName.toLowerCase().includes(lower),
      );
    }

    if (activeFilters.length > 0) {
      result = result.filter((e) => {
        return activeFilters.some((f) => {
          if (f === "Read") return e.callType === "read";
          if (f === "Write") return e.callType === "write";
          if (f === "Success") return e.status === "success";
          if (f === "Error") return e.status === "error";
          return true;
        });
      });
    }

    return result;
  }, [entries, searchTerm, activeFilters]);

  const formatDate = (ts: number) => formatTimestamp(ts);

  const chips: FilterChip[] = ["All", "Read", "Write", "Success", "Error"];

  const handleExportJSON = () => {
    const raw = formatted.map(({ ts: _ts, ...rest }) => rest);
    downloadFile(
      JSON.stringify(raw, null, 2),
      "debug-history.json",
      "application/json",
    );
  };

  const handleExportCSV = () => {
    const raw = formatted.map(({ ts: _ts, ...rest }) => rest);
    downloadFile(entriesToCSV(raw), "debug-history.csv", "text/csv");
  };

  const handleClear = () => {
    if (selectedAddress) clearHistory(selectedAddress);
  };

  return (
    <div className="w-full xl:w-[400px] flex flex-col gap-6">
      {/* Tab header — matches Read/Write tab bar */}
      <div className="tabs tabs-box border border-[#8A45FC] rounded-[5px] bg-transparent">
        <a className="tab h-10 w-full tab-active bg-[#8A45FC]! rounded-[5px]! text-white!">
          History
        </a>
      </div>

      {/* Content card — matches the contract methods card */}
      <div className="rounded-[5px] border border-[#8A45FC] bg-component flex flex-col max-h-[600px]">
        {/* Search bar */}
        <div className="p-3 pb-0">
          <input
            type="text"
            className={`w-full text-sm rounded-[5px] px-3 py-2 outline-none border transition-colors ${
              isDarkMode
                ? "bg-[#0C1023] border-[#ffffff1a] focus:border-[#8A45FC] placeholder:text-neutral"
                : "bg-base-200 border-transparent focus:border-[#8A45FC] placeholder:text-neutral"
            }`}
            placeholder="Search by function name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter chips + toolbar */}
        <div className="px-3 pt-3 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip) => {
              const isActive =
                chip === "All"
                  ? activeFilters.length === 0
                  : activeFilters.includes(chip);
              return (
                <button
                  key={chip}
                  onClick={() => toggleFilter(chip)}
                  className={`px-2.5 py-1 rounded-[5px] text-xs font-medium transition-colors border ${
                    isActive
                      ? "bg-[#8A45FC] text-white border-[#8A45FC]"
                      : isDarkMode
                        ? "bg-transparent text-neutral border-[#ffffff1a] hover:border-[#8A45FC]/50"
                        : "bg-transparent text-neutral border-black/10 hover:border-[#8A45FC]/50"
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>

          {/* Export / Clear toolbar */}
          <div className="flex items-center gap-1 border-b border-secondary pb-2">
            <button
              className="text-xs text-[#8A45FC] hover:text-[#a06aff] transition-colors disabled:opacity-40 disabled:hover:text-[#8A45FC] px-1.5 py-0.5"
              onClick={handleExportJSON}
              disabled={formatted.length === 0}
            >
              Export JSON
            </button>
            <span className="text-neutral/30">|</span>
            <button
              className="text-xs text-[#8A45FC] hover:text-[#a06aff] transition-colors disabled:opacity-40 disabled:hover:text-[#8A45FC] px-1.5 py-0.5"
              onClick={handleExportCSV}
              disabled={formatted.length === 0}
            >
              Export CSV
            </button>
            <button
              className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-40 ml-auto px-1.5 py-0.5"
              onClick={handleClear}
              disabled={entries.length === 0}
            >
              Clear
            </button>
          </div>
        </div>

        {/* History entries list */}
        <div className="flex-1 overflow-y-auto">
          {formatted.length === 0 ? (
            <div className="p-4 text-sm text-neutral text-center">
              No history yet.
            </div>
          ) : (
            formatted.map((e) => (
              <button
                key={e.txHash ?? `${e.functionName}-${e.timestamp}`}
                className={`w-full flex items-center justify-between py-3 px-3 text-left border-b transition-colors ${
                  isDarkMode
                    ? "border-b-[#ffffff12] hover:bg-[#ffffff08]"
                    : "border-b-black/10 hover:bg-black/5"
                }`}
                onClick={() => setOpenEntry(e)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-[3px] text-[10px] font-bold leading-none ${
                      e.callType === "read"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-amber-500/20 text-amber-400"
                    }`}
                  >
                    {e.callType === "read" ? "R" : "W"}
                  </span>
                  <span className="truncate text-sm text-[#4DB4FF]">
                    {e.functionName}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] text-neutral">
                      {formatDate(e.timestamp)}
                    </span>
                    {e.duration !== undefined && (
                      <span className="text-[10px] text-neutral/50">
                        {e.duration}ms
                      </span>
                    )}
                  </div>
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
