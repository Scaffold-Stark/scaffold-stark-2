"use client";
import React, { useState } from "react";
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
  const [copied, setCopied] = useState(false);

  const isSuccess = entry.status === "success";
  const chipClasses = isSuccess
    ? "bg-green-500/20 text-green-400"
    : "bg-red-500/20 text-red-400";
  const iconSrc = isSuccess ? "/success-icon.svg" : "/fail-icon.svg";
  const sectionTitle = isSuccess ? "Message" : "Receipt";
  const sectionBg = isSuccess ? "bg-green-900/30" : "bg-red-900/30";
  const chipLabel = isSuccess ? "Success" : "Fail";

  const callTypeBadgeClasses =
    entry.callType === "read"
      ? "bg-blue-500/20 text-blue-400"
      : "bg-amber-500/20 text-amber-400";
  const callTypeLabel = entry.callType === "read" ? "Read" : "Write";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(entry, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard access denied — silently ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-xs" onClick={onClose} />
      <div
        className={`relative z-10 w-full max-w-2xl max-h-[90vh] rounded-[5px] border border-[#8A45FC] p-4 flex flex-col ${isDarkMode ? "bg-[#0C1023]" : "bg-base-100"}`}
      >
        {/* Header row */}
        <div className="flex items-start justify-between mb-2 flex-shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 font-semibold">{entry.functionName}</h3>

            {/* Status chip */}
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${chipClasses}`}
            >
              <Image src={iconSrc} alt={chipLabel} width={16} height={16} />
              {chipLabel}
            </span>

            {/* Call type badge */}
            <span
              className={`inline-flex items-center text-xs px-2 py-0.5 rounded ${callTypeBadgeClasses}`}
            >
              {callTypeLabel}
            </span>

            {/* Gas used */}
            {entry.gasUsed && (
              <span className="text-xs text-neutral">
                Gas: {entry.gasUsed}
              </span>
            )}

            {/* Duration */}
            {entry.duration !== undefined && (
              <span className="text-xs text-neutral">
                Duration: {entry.duration}ms
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <button
              className="btn btn-ghost btn-xs"
              onClick={handleCopy}
              title="Copy entry as JSON"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button className="btn btn-ghost btn-xs" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {/* Input section */}
          <div className="bg-base-200 text-sm px-4 py-2 rounded">
            <div className="flex items-center justify-between">
              <span>Your input</span>
              <span className="text-xs">{formatDate(entry.timestamp)}</span>
            </div>
            <pre className="m-0 whitespace-pre-wrap max-h-32 overflow-y-auto">
              {entry.input || "[code here]"}
            </pre>
          </div>

          {/* Message / Receipt section */}
          <div className={`text-sm px-4 py-2 rounded ${sectionBg}`}>
            <p className="font-bold m-0 mb-1">{sectionTitle}</p>
            <pre className="whitespace-pre-wrap break-words m-0 max-h-64 overflow-y-auto">
              {entry.message}
            </pre>
          </div>

          {/* Decoded result section */}
          {entry.decodedResult && (
            <div className="bg-green-900/20 text-sm px-4 py-2 rounded">
              <p className="font-bold m-0 mb-1 text-green-400">
                Decoded Result
              </p>
              <pre className="whitespace-pre-wrap break-words m-0 max-h-48 overflow-y-auto text-green-300">
                {entry.decodedResult}
              </pre>
            </div>
          )}

          {/* Error details collapsible section */}
          {entry.errorDetails && (
            <details className="bg-red-900/20 text-sm px-4 py-2 rounded">
              <summary className="font-bold cursor-pointer text-red-400 select-none">
                Error Details
              </summary>
              <pre className="whitespace-pre-wrap break-words m-0 mt-2 max-h-48 overflow-y-auto text-red-300">
                {entry.errorDetails}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
