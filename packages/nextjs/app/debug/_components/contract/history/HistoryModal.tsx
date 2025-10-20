"use client";
import React from "react";
import Image from "next/image";
import { HistoryEntry } from "~~/services/store/history";

export default function HistoryModal({
  entry,
  onClose,
}: {
  entry: HistoryEntry;
  onClose: () => void;
}) {
  const formatDate = (ts: number) =>
    new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(ts));

  const isSuccess = entry.status === "success";
  const chipClasses = isSuccess
    ? "bg-green-500/20 text-green-400"
    : "bg-red-500/20 text-red-400";
  const iconSrc = isSuccess ? "/success-icon.svg" : "/fail-icon.svg";
  const sectionTitle = isSuccess ? "Message" : "Receipt";
  const sectionBg = isSuccess ? "bg-green-900/30" : "bg-red-900/30";
  const chipLabel = isSuccess ? "Success" : "Fail";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 backdrop-blur-xs" onClick={onClose} />
      <div className="relative z-10 w-[95%] max-w-2xl rounded-[5px] border border-[#8A45FC] bg-[#0C1023] p-4">
        <div className="flex items-center justify-between mb-2">
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

        <div className="bg-input text-sm px-4 py-2 mb-3 rounded">
          <div className="flex items-center justify-between">
            <span>Your input</span>
            <span className="text-xs">{formatDate(entry.timestamp)}</span>
          </div>
          <pre className="m-0 whitespace-pre-wrap">
            {entry.input || "[code here]"}
          </pre>
        </div>

        <div className={`text-sm px-4 py-2 rounded ${sectionBg}`}>
          <p className="font-bold m-0 mb-1">{sectionTitle}</p>
          <pre className="whitespace-pre-wrap break-words m-0">
            {entry.message}
          </pre>
        </div>
      </div>
    </div>
  );
}
