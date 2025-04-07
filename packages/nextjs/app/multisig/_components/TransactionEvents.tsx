import React from "react";
import { BlockieAvatar } from "~~/components/scaffold-stark";
import {
  convertFeltToAddress,
  formatAddress,
  TransactionEventsProps,
} from "../types";

const TransactionEvents: React.FC<TransactionEventsProps> = ({
  submittedTxEvents,
  confirmedTxEvents,
  executedTxEvents,
}) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-3">Transaction Events</h3>

      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-sm mb-2">
            Recent Submitted Transactions:
          </h4>
          {!submittedTxEvents || submittedTxEvents.length === 0 ? (
            <p className="text-gray-400 text-sm">No recent submissions</p>
          ) : (
            <div className="max-h-40 overflow-y-auto">
              {submittedTxEvents.slice(0, 5).map((event, index) => (
                <div
                  key={index}
                  className="text-sm p-2 my-1 rounded bg-gray-700"
                >
                  <div className="space-y-2">
                    <div className="font-mono text-xs">
                      ID: {formatAddress(event.args.id.toString())}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      <span>By:</span>
                      <div className="flex items-center gap-1.5">
                        <BlockieAvatar
                          address={convertFeltToAddress(
                            event.args.signer?.toString() || "",
                          )}
                          size={16}
                        />
                        {formatAddress(
                          convertFeltToAddress(
                            event.args.signer?.toString() || "",
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-2">Recent Confirmations:</h4>
          {!confirmedTxEvents || confirmedTxEvents.length === 0 ? (
            <p className="text-gray-400 text-sm">No recent confirmations</p>
          ) : (
            <div className="max-h-40 overflow-y-auto">
              {confirmedTxEvents.slice(0, 5).map((event, index) => (
                <div
                  key={index}
                  className="text-sm p-2 my-1 rounded bg-gray-700"
                >
                  <div className="space-y-3">
                    <div className="font-mono text-xs">
                      ID: {formatAddress(event.args.id.toString())}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      <span>By:</span>
                      <div className="flex items-center gap-1.5">
                        <BlockieAvatar
                          address={convertFeltToAddress(
                            event.args.signer?.toString() || "",
                          )}
                          size={16}
                        />
                        {formatAddress(
                          convertFeltToAddress(
                            event.args.signer?.toString() || "",
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-2">Recent Executions:</h4>
          {!executedTxEvents || executedTxEvents.length === 0 ? (
            <p className="text-gray-400 text-sm">No recent executions</p>
          ) : (
            <div className="max-h-40 overflow-y-auto">
              {executedTxEvents.slice(0, 5).map((event, index) => (
                <div
                  key={index}
                  className="text-sm p-2 my-1 rounded bg-gray-700"
                >
                  <div className="font-mono text-xs">
                    ID: {formatAddress(event.args.id.toString())}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionEvents;
