import React from "react";
import { useRouter } from "next/navigation";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import {
  getDisplayValue,
  getCairoType,
  getCopyValue,
  hasMeaningfulDecodedArgs,
  extractEventKeys,
  extractEventData,
  getTimeAgo,
} from "~~/utils/blockexplorer";
import { CopyButton } from "./CopyButton";

interface Event {
  transactionHash: string;
  eventIndex: number;
  eventName?: string;
  contractAddress: string;
  blockNumber: number;
  timestamp?: number;
  args: Record<string, any>;
  parsedArgs: Record<string, any>;
  argTypes?: Record<string, string>;
}

interface EventsTableProps {
  events: Event[];
  expandedEvents: Set<string>;
  showRawEventData: boolean;
  copiedField: string | null;
  onToggleExpansion: (eventId: string) => void;
  onCopy: (text: string, fieldName: string) => void;
  showTransactionColumn?: boolean;
  currentAddress?: string;
}

export const EventsTable: React.FC<EventsTableProps> = ({
  events,
  expandedEvents,
  showRawEventData,
  copiedField,
  onToggleExpansion,
  onCopy,
  showTransactionColumn = true,
  currentAddress,
}) => {
  const router = useRouter();

  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr className="border-b border-base-300 bg-base-100">
            <th className="text-left text-base-content/70 font-medium py-3 px-4">
              Name
            </th>
            <th className="text-left text-base-content/70 font-medium py-3 px-4">
              <div className="flex items-center space-x-1">
                <span>Block Num.</span>
                <ChevronDownIcon className="h-4 w-4" />
              </div>
            </th>
            {showTransactionColumn && (
              <th className="text-left text-base-content/70 font-medium py-3 px-4">
                Transaction Hash
              </th>
            )}
            <th className="text-left text-base-content/70 font-medium py-3 px-4">
              From Address
            </th>
            <th className="text-left text-base-content/70 font-medium py-3 px-4">
              <div className="flex items-center space-x-1">
                <span>Age</span>
                <ChevronDownIcon className="h-4 w-4" />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((event, index) => {
            const eventId = `${event.transactionHash}-${event.eventIndex}`;
            const isExpanded = expandedEvents.has(eventId);

            return (
              <React.Fragment key={eventId}>
                {/* Main Event Row */}
                <tr className="border-b border-base-300/30 hover:bg-base-50/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onToggleExpansion(eventId)}
                        className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDownIcon className="h-4 w-4" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4" />
                        )}
                        <span className="font-medium">
                          {event.eventName || "Event"}
                        </span>
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-blue-400 font-medium">
                      {event.blockNumber}
                    </span>
                  </td>
                  {showTransactionColumn && (
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            router.push(
                              `/blockexplorer/tx/${event.transactionHash}`,
                            )
                          }
                          className="text-blue-400 font-mono text-sm hover:text-blue-300 hover:underline transition-colors"
                        >
                          {`${event.transactionHash.slice(0, 8)}...${event.transactionHash.slice(-4)}`}
                        </button>
                        <CopyButton
                          text={event.transactionHash}
                          fieldName={`event-tx-${index}`}
                          copiedField={copiedField}
                          onCopy={onCopy}
                        />
                      </div>
                    </td>
                  )}
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          router.push(
                            `/blockexplorer/address/${event.contractAddress}`,
                          )
                        }
                        className="text-blue-400 font-mono text-sm hover:text-blue-300 hover:underline transition-colors"
                      >
                        {event.contractAddress === currentAddress
                          ? "Self Contract"
                          : `${event.contractAddress.slice(0, 6)}...${event.contractAddress.slice(-4)}`}
                      </button>
                      {currentAddress && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                      <CopyButton
                        text={event.contractAddress}
                        fieldName={`event-contract-${index}`}
                        copiedField={copiedField}
                        onCopy={onCopy}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-base-content/70 text-sm">
                      {getTimeAgo(event.timestamp || 0)}
                    </span>
                  </td>
                </tr>

                {/* Expanded Event Arguments Row */}
                {isExpanded && (
                  <tr className="bg-base-50/30">
                    <td
                      colSpan={showTransactionColumn ? 5 : 4}
                      className="py-4 px-4"
                    >
                      <div className="bg-base-100 rounded-lg p-4 border border-base-300">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-base-content">
                            Event Arguments
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-base-content/50">
                              {showRawEventData ? "Raw" : "Decoded"}
                            </span>
                          </div>
                        </div>

                        {showRawEventData ? (
                          // Raw event data display
                          <div className="space-y-3">
                            <div className="flex flex-col space-y-1 border-b border-base-300/30 pb-2">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-base-content/70 text-sm">
                                  keys:
                                </span>
                                <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                  array
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <code className="text-sm font-mono text-base-content bg-base-200 px-2 py-1 rounded break-all">
                                  {JSON.stringify(extractEventKeys(event.args))}
                                </code>
                                <CopyButton
                                  text={JSON.stringify(
                                    extractEventKeys(event.args),
                                  )}
                                  fieldName={`event-keys-${index}`}
                                  copiedField={copiedField}
                                  onCopy={onCopy}
                                />
                              </div>
                            </div>
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-base-content/70 text-sm">
                                  data:
                                </span>
                                <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                  array
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <code className="text-sm font-mono text-base-content bg-base-200 px-2 py-1 rounded break-all">
                                  {JSON.stringify(extractEventData(event.args))}
                                </code>
                                <CopyButton
                                  text={JSON.stringify(
                                    extractEventData(event.args),
                                  )}
                                  fieldName={`event-data-${index}`}
                                  copiedField={copiedField}
                                  onCopy={onCopy}
                                />
                              </div>
                            </div>
                          </div>
                        ) : hasMeaningfulDecodedArgs(event.parsedArgs) ? (
                          <div className="bg-base-200 rounded-lg overflow-hidden">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-base-300 text-base-content/70 text-sm font-medium">
                              <div className="col-span-3">INPUT</div>
                              <div className="col-span-5">TYPE</div>
                              <div className="col-span-4">DATA</div>
                            </div>

                            {/* Table Body */}
                            <div className="divide-y divide-base-300/50">
                              {Object.entries(event.parsedArgs).map(
                                ([key, value], argIndex) => {
                                  const displayValue = getDisplayValue(value);
                                  const cairoType = getCairoType(
                                    value,
                                    key,
                                    event.argTypes,
                                  );
                                  const copyValue = getCopyValue(value);

                                  return (
                                    <div
                                      key={argIndex}
                                      className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-base-100/50"
                                    >
                                      {/* INPUT Column */}
                                      <div className="col-span-3">
                                        <span className="text-base-content font-medium">
                                          {key}
                                        </span>
                                      </div>

                                      {/* TYPE Column */}
                                      <div className="col-span-5">
                                        <code className="text-orange-600 text-sm font-mono">
                                          {cairoType}
                                        </code>
                                      </div>

                                      {/* DATA Column */}
                                      <div className="col-span-4">
                                        <div className="flex items-center space-x-2">
                                          <code className="text-blue-600 text-sm font-mono break-all">
                                            {displayValue}
                                          </code>
                                          <CopyButton
                                            text={copyValue}
                                            fieldName={`event-arg-${index}-${argIndex}`}
                                            copiedField={copiedField}
                                            onCopy={onCopy}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                },
                              )}
                            </div>
                          </div>
                        ) : Object.keys(event.parsedArgs).length > 0 ? (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <p className="text-amber-800 text-sm mb-2">
                              <strong>
                                Raw event data (ABI decoding unavailable):
                              </strong>
                            </p>
                            <div className="space-y-2">
                              {Object.entries(event.parsedArgs).map(
                                ([key, value], argIndex) => (
                                  <div
                                    key={argIndex}
                                    className="flex items-center justify-between"
                                  >
                                    <span className="text-amber-700 font-mono text-sm">
                                      {key}:
                                    </span>
                                    <code className="text-amber-900 bg-amber-100 px-2 py-1 rounded text-sm">
                                      {String(value)}
                                    </code>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-base-content/50 text-sm">
                            No decoded arguments available for this event
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
