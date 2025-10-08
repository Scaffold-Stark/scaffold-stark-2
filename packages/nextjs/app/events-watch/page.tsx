"use client";

import type { NextPage } from "next";
import { useCallback, useMemo, useRef, useState } from "react";
import { Address } from "~~/components/scaffold-stark";
import {
  normalizeToHexAddress,
  formatStrk,
} from "~~/utils/scaffold-stark/common";
import { useScaffoldWatchContractEvent } from "~~/hooks/scaffold-stark/useScaffoldWatchContractEvent";

type LiveEventItem = {
  log: any;
  args: any;
  parsedArgs?: any;
};

// Use shared helpers
const formatEventAddress = (address: any): `0x${string}` =>
  normalizeToHexAddress(address);
const formatStrkValue = (value: any): string => formatStrk(value);

const EventsWatchPage: NextPage = () => {
  const [items, setItems] = useState<LiveEventItem[]>([]);
  const [isWsActive, setIsWsActive] = useState(true);
  const latestRef = useRef<HTMLDivElement | null>(null);

  const onLogs = useCallback((e: any) => {
    setItems((prev) =>
      [{ log: e.log, args: e.args, parsedArgs: e.parsedArgs }, ...prev].slice(
        0,
        200,
      ),
    );
  }, []);

  const { isLoading, error } = useScaffoldWatchContractEvent({
    contractName: "YourContract",
    eventName: "GreetingChanged" as any,
    onLogs,
  });

  const totalEvents = useMemo(() => items.length, [items.length]);

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <div className="bg-primary py-12 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-primary-content mb-4">
            Watch GreetingChanged (WebSocket)
          </h1>
          <p className="text-lg text-primary-content/80">
            Live updates driven by useScaffoldWatchContractEvent
          </p>
        </div>
      </div>

      <div className="flex-1 px-6 lg:px-10 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-2">
            <button
              className="btn btn-sm"
              onClick={() => setItems([])}
              title="Clear received events"
            >
              Clear
            </button>
            <span className="text-sm opacity-70">Total: {totalEvents}</span>
            {isLoading ? (
              <span className="text-sm text-info">Connecting...</span>
            ) : error ? (
              <span className="text-sm text-error">WS Error</span>
            ) : (
              <span className="text-sm text-success">Live</span>
            )}
            <div className="form-control">
              <label className="label cursor-pointer gap-2">
                <span className="label-text">Auto-scroll</span>
                <input
                  type="checkbox"
                  className="toggle toggle-sm"
                  checked={isWsActive}
                  onChange={(e) => setIsWsActive(e.target.checked)}
                />
              </label>
            </div>
          </div>

          <div className="bg-base-100 rounded-lg shadow-lg overflow-hidden border border-base-300 max-w-6xl w-full">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-base-200/50 border-b border-base-300">
                    <th className="text-left py-3 px-4">Block</th>
                    <th className="text-left py-3 px-4">Greeting Setter</th>
                    <th className="text-left py-3 px-4">New Greeting</th>
                    <th className="text-left py-3 px-4">Premium</th>
                    <th className="text-left py-3 px-4">Value</th>
                    <th className="text-left py-3 px-4">Tx Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-8 text-base-content/70"
                      >
                        Waiting for events...
                      </td>
                    </tr>
                  ) : (
                    items.map((e, idx) => {
                      const addr = e.args?.greeting_setter as any;
                      const txHash = e.log?.transaction_hash as
                        | string
                        | undefined;
                      const blockNumber = e.log?.block_number as
                        | number
                        | undefined;
                      const newGreeting =
                        e.parsedArgs?.new_greeting ??
                        e.args?.new_greeting ??
                        "";
                      const premium = Boolean(e.args?.premium);
                      const value = e.args?.value;
                      return (
                        <tr
                          key={`${txHash}-${e.log?.event_index}-${idx}`}
                          className="border-b border-base-300"
                        >
                          <td className="py-3 px-4 font-mono text-blue-500">
                            {blockNumber ?? "N/A"}
                          </td>
                          <td className="py-3 px-4">
                            {addr ? (
                              <Address
                                address={formatEventAddress(addr)}
                                size="sm"
                              />
                            ) : (
                              <span>N/A</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm break-words">
                            {newGreeting || "N/A"}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${premium ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                            >
                              {premium ? "Premium" : "Free"}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-sm">
                            {formatStrkValue(value)}
                          </td>
                          <td className="py-3 px-4">
                            {txHash ? (
                              <a
                                href={`/blockexplorer/tx/${txHash}`}
                                className="text-blue-500 hover:text-blue-600 transition-colors font-mono text-sm"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {`${txHash.slice(0, 8)}...${txHash.slice(-4)}`}
                              </a>
                            ) : (
                              <span className="text-sm text-base-content/80">
                                N/A
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div ref={latestRef} />

          <div className="mt-8 p-6 bg-base-100 rounded-lg border border-base-300">
            <h3 className="text-lg font-bold mb-4">Debug</h3>
            <div className="text-sm grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p>Total Events: {totalEvents}</p>
                <p>Event Name: GreetingChanged</p>
              </div>
              <div>
                <p>
                  WebSocket:{" "}
                  {error ? "Error" : isLoading ? "Connecting" : "Connected"}
                </p>
                <p>Contract: YourContract</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsWatchPage;
