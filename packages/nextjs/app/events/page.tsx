"use client";

import type { NextPage } from "next";
import { Address } from "~~/components/scaffold-stark";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-stark/useScaffoldEventHistory";

// Helper function to format address from event data
const formatEventAddress = (address: any): `0x${string}` => {
  if (!address) return "0x0";

  // If it's already a string, return as is
  if (typeof address === "string") {
    return address as `0x${string}`;
  }

  // If it's a BigInt or number, convert to hex string
  if (typeof address === "bigint" || typeof address === "number") {
    const hex = address.toString(16);
    // Ensure it's properly padded and has 0x prefix
    return `0x${hex.padStart(64, "0")}` as `0x${string}`;
  }

  return "0x0";
};

// Helper function to format STRK value from event data
const formatStrkValue = (value: any): string => {
  if (value === null || value === undefined) return "0 STRK";

  try {
    // Handle CairoOption type
    if (
      value &&
      typeof value === "object" &&
      "Some" in value &&
      "None" in value
    ) {
      // It's a CairoOption
      if (value.Some !== undefined) {
        // Some value exists
        const numValue = BigInt(value.Some);
        const strkValue = Number(numValue) / 1e18;
        return `${strkValue.toFixed(4)} STRK`;
      } else {
        // None value
        return "0 STRK";
      }
    }

    // Handle direct BigInt values
    if (typeof value === "bigint") {
      const strkValue = Number(value) / 1e18;
      return `${strkValue.toFixed(4)} STRK`;
    }

    // Handle string values
    if (typeof value === "string") {
      if (value.trim() === "" || value === "0") return "0 STRK";
      const numValue = BigInt(value);
      const strkValue = Number(numValue) / 1e18;
      return `${strkValue.toFixed(4)} STRK`;
    }

    // Handle number values
    if (typeof value === "number") {
      if (value === 0) return "0 STRK";
      const strkValue = value / 1e18;
      return `${strkValue.toFixed(4)} STRK`;
    }

    return "0 STRK";
  } catch (error) {
    console.error("Error formatting STRK value:", error, value);
    return "0 STRK";
  }
};

const Events: NextPage = () => {
  const {
    data: greetingEvents,
    isLoading,
    error,
  } = useScaffoldEventHistory({
    contractName: "YourContract",
    eventName: "GreetingChanged",
    fromBlock: 0n,
    watch: true,
    blockData: true,
    transactionData: true,
    receiptData: true,
  });

  if (isLoading)
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-xl"></span>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center mt-10">
        <div className="alert alert-error max-w-md">
          <span>Error loading events: {String(error)}</span>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      {/* Header with gradient background */}
      <div className="bg-primary py-12 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-primary-content mb-4">
            GreetingChanged Events
          </h1>
          <p className="text-lg text-primary-content/80">
            Real-time events from YourContract using WebSocket
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-6 lg:px-10 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-base-100 rounded-lg shadow-lg overflow-hidden border border-base-300 max-w-6xl w-full">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-base-200/50 border-b border-base-300">
                    <th className="text-left py-4 px-4 font-semibold text-base-content">
                      Block Number
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-base-content">
                      Greeting Setter
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-base-content">
                      New Greeting
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-base-content">
                      Premium
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-base-content">
                      Value (STRK)
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-base-content">
                      Transaction Hash
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!greetingEvents || greetingEvents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-8 text-base-content/70"
                      >
                        No events found
                      </td>
                    </tr>
                  ) : (
                    greetingEvents?.map((event, index) => {
                      return (
                        <tr
                          key={`${event.log?.transaction_hash}-${event.log?.event_index}-${index}`}
                          className="border-b border-base-300 hover:bg-base-200/30 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <span className="text-blue-500 font-medium">
                              {event.log?.block_number?.toString() || "N/A"}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <Address
                              address={formatEventAddress(
                                event.args?.greeting_setter,
                              )}
                              size="sm"
                            />
                          </td>
                          <td className="py-4 px-4 max-w-xs">
                            <span className="text-sm text-base-content/80 break-words">
                              {event.parsedArgs?.new_greeting ||
                                event.args?.new_greeting ||
                                "N/A"}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                event.args?.premium
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {event.args?.premium ? "Premium" : "Free"}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-base-content/80 font-mono">
                              {formatStrkValue(event.args?.value)}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {event.log?.transaction_hash ? (
                              <a
                                href={`/blockexplorer/tx/${event.log.transaction_hash}`}
                                className="text-blue-500 hover:text-blue-600 transition-colors font-mono text-sm"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {`${event.log.transaction_hash.slice(0, 8)}...${event.log.transaction_hash.slice(-4)}`}
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

          {/* Debug info */}
          <div className="mt-8 p-6 bg-base-100 rounded-lg border border-base-300">
            <h3 className="text-lg font-bold mb-4 text-base-content">
              Debug Info
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="text-base-content/70">
                  <strong>Total Events:</strong> {greetingEvents?.length || 0}
                </p>
                <p className="text-base-content/70">
                  <strong>Event Name:</strong> GreetingChanged
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-base-content/70">
                  <strong>WebSocket Status:</strong> Real-time events enabled
                </p>
                <p className="text-base-content/70">
                  <strong>Contract:</strong> YourContract
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;
