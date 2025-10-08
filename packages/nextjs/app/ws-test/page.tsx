"use client";

import { useState } from "react";
import { useWebSocketData } from "~~/hooks/scaffold-stark/useWebSocketData";

export default function WsTestPage() {
  const [topic, setTopic] = useState<
    "newHeads" | "newTransactionReceipts" | "transactionStatus"
  >("newHeads");
  const [txHash, setTxHash] = useState<string>("");

  const { data, isConnected, isLoading, error } = useWebSocketData({
    topic,
    params:
      topic === "transactionStatus"
        ? ({ transactionHash: txHash || "0x0" } as any)
        : ({} as any),
    enabled: topic !== "transactionStatus" || Boolean(txHash),
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">WebSocket Data Test</h1>

      <div className="flex items-center gap-3">
        <select
          className="select select-bordered select-sm"
          value={topic}
          onChange={(e) => setTopic(e.target.value as any)}
        >
          <option value="newHeads">newHeads</option>
          <option value="newTransactionReceipts">newTransactionReceipts</option>
          <option value="transactionStatus">transactionStatus</option>
        </select>

        {topic === "transactionStatus" && (
          <input
            className="input input-bordered input-sm w-96"
            placeholder="Transaction hash (0x...)"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
          />
        )}

        <span className="text-sm">
          {isLoading
            ? "Connecting..."
            : error
              ? "Error"
              : isConnected
                ? "Connected"
                : "Idle"}
        </span>
      </div>

      <div className="bg-base-100 border border-base-300 rounded p-3 max-h-[50vh] overflow-auto text-xs font-mono">
        {data.length === 0 ? (
          <div className="opacity-70">No messages yet.</div>
        ) : (
          data.slice(0, 20).map((msg, i) => (
            <pre key={i} className="mb-2 whitespace-pre-wrap break-words">
              {JSON.stringify(msg, null, 2)}
            </pre>
          ))
        )}
      </div>
    </div>
  );
}
