"use client";
import React from "react";
import { HistoryEntry } from "~~/services/store/history";

export default function SuccessHistoryModal({
  entry,
  onClose,
}: {
  entry: HistoryEntry;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-[95%] max-w-2xl rounded-[5px] border border-[#8A45FC] bg-component p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="m-0 font-semibold">{entry.functionName}</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
              Success
            </span>
          </div>
          <button className="btn btn-ghost btn-xs" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="bg-input text-sm px-4 py-2 mb-3 rounded">
          <div className="flex items-center justify-between">
            <span className="opacity-70">Your input</span>
            <span className="text-xs opacity-70">
              {new Date(entry.timestamp).toLocaleString()}
            </span>
          </div>
          <pre className="m-0 whitespace-pre-wrap">
            {entry.input || "[code here]"}
          </pre>
        </div>

        <div className="text-sm px-4 py-2 rounded bg-green-900/30">
          <p className="font-bold m-0 mb-1">Message</p>
          <pre className="whitespace-pre-wrap break-words m-0">
            {entry.message}
          </pre>
        </div>
      </div>
    </div>
  );
}
