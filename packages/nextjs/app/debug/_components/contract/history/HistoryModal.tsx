"use client";
import React from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { HistoryEntry } from "~~/services/store/history";
import { formatTimestamp } from "~~/utils/scaffold-stark/common";

export default function HistoryModal({
  entry,
  onClose,
}: {
  entry: HistoryEntry;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const formatDate = (ts: number) => formatTimestamp(ts);

  const isSuccess = entry.status === "success";
  const chipClasses = isSuccess
    ? "bg-green-500/20 text-green-400"
    : "bg-red-500/20 text-red-400";
  const iconSrc = isSuccess ? "/success-icon.svg" : "/fail-icon.svg";
  const sectionTitle = isSuccess ? "Message" : "Receipt";
  const sectionBg = isSuccess ? "bg-green-900/30" : "bg-red-900/30";
  const chipLabel = isSuccess ? "Success" : "Fail";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-xs" onClick={onClose} />
      <div
        className={`relative z-10 w-full max-w-2xl max-h-[90vh] rounded-[5px] border border-[#8A45FC] p-4 flex flex-col ${isDarkMode ? "bg-[#0C1023]" : "bg-base-100"}`}
      >
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="m-0 font-semibold">{entry.functionName}</h3>
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${chipClasses}`}
            >
              <Image src={iconSrc} alt={chipLabel} width={16} height={16} />
              {chipLabel}
            </span>
          </div>
          <button className="btn btn-ghost btn-xs" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          <div className="bg-base-200 text-sm px-4 py-2 rounded">
            <div className="flex items-center justify-between">
              <span>Your input</span>
              <span className="text-xs">{formatDate(entry.timestamp)}</span>
            </div>
            <pre className="m-0 whitespace-pre-wrap max-h-32 overflow-y-auto">
              {entry.input || "[code here]"}
            </pre>
          </div>

          <div className={`text-sm px-4 py-2 rounded ${sectionBg}`}>
            <p className="font-bold m-0 mb-1">{sectionTitle}</p>
            <pre className="whitespace-pre-wrap break-words m-0 max-h-64 overflow-y-auto">
              {entry.message}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
