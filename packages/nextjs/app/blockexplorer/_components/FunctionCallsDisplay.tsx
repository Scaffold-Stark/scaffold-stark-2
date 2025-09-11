import React from "react";
import { Address } from "~~/components/scaffold-stark";
import {
  DecodedFunctionCall,
  getDisplayValue,
  getCairoType,
  getCopyValue,
} from "~~/utils/blockexplorer";
import { CopyButton } from "./CopyButton";

interface FunctionCallsDisplayProps {
  functionCalls: DecodedFunctionCall[];
  showRawEventData: boolean;
  copiedField: string | null;
  onCopy: (text: string, fieldName: string) => void;
}

export const FunctionCallsDisplay: React.FC<FunctionCallsDisplayProps> = ({
  functionCalls,
  showRawEventData,
  copiedField,
  onCopy,
}) => (
  <div className="flex flex-col space-y-2">
    <label className="text-lg font-semibold text-base-content">
      Function Calls:
    </label>
    <div className="space-y-4">
      {functionCalls.map((call, index) => (
        <div key={index} className="bg-base-200 p-4 rounded-lg">
          <div className="space-y-2">
            <div>
              <span className="text-sm font-semibold text-base-content/70">
                Contract:
              </span>
              <div className="flex items-center mt-1">
                <Address
                  address={call.contractAddress as `0x${string}`}
                  format="long"
                  size="sm"
                />
                <CopyButton
                  text={call.contractAddress}
                  fieldName={`contract-${index}`}
                  copiedField={copiedField}
                  onCopy={onCopy}
                />
              </div>
            </div>
            <div>
              <span className="text-sm font-semibold text-base-content/70">
                Entrypoint:
              </span>
              <code className="text-sm text-accent bg-base-300 px-2 py-1 rounded ml-2">
                {call.entrypoint}
              </code>
            </div>
            {call.selector && (
              <div>
                <span className="text-sm font-semibold text-base-content/70">
                  Selector:
                </span>
                <div className="flex items-center mt-1">
                  <code className="text-xs font-mono text-base-content bg-base-200 px-2 py-1 rounded break-all">
                    {call.selector}
                  </code>
                  <CopyButton
                    text={call.selector}
                    fieldName={`selector-${index}`}
                    copiedField={copiedField}
                    onCopy={onCopy}
                  />
                </div>
              </div>
            )}
            {(call.calldata.length > 0 ||
              (call.decodedArgs &&
                Object.keys(call.decodedArgs).length > 0)) && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-base-content/70">
                    Arguments:
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-base-content/50">
                      Raw Data:
                    </span>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary toggle-xs"
                      checked={showRawEventData}
                      onChange={() => {}} // This should be controlled by parent
                    />
                  </div>
                </div>

                {showRawEventData ? (
                  // Raw arguments display
                  <div className="mt-1 max-h-32 overflow-y-auto">
                    {call.calldata.map((arg, argIndex) => (
                      <div
                        key={argIndex}
                        className="text-xs font-mono text-base-content/60 break-all"
                      >
                        [{argIndex}] {arg}
                      </div>
                    ))}
                  </div>
                ) : call.decodedArgs &&
                  Object.keys(call.decodedArgs).length > 0 ? (
                  // Decoded arguments display
                  <div className="bg-base-300 rounded-lg overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-3 py-2 bg-base-200 text-base-content/70 text-xs font-medium">
                      <div className="col-span-3">INPUT</div>
                      <div className="col-span-5">TYPE</div>
                      <div className="col-span-4">DATA</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-base-200/50">
                      {Object.entries(call.decodedArgs).map(
                        ([key, value], argIndex) => {
                          const displayValue = getDisplayValue(value);
                          const cairoType = getCairoType(
                            value,
                            key,
                            call.argTypes,
                          );
                          const copyValue = getCopyValue(value);

                          return (
                            <div
                              key={argIndex}
                              className="grid grid-cols-12 gap-4 px-3 py-2 hover:bg-base-100/50"
                            >
                              {/* INPUT Column */}
                              <div className="col-span-3">
                                <span className="text-base-content font-medium text-xs">
                                  {key}
                                </span>
                              </div>

                              {/* TYPE Column */}
                              <div className="col-span-5">
                                <code className="text-orange-600 text-xs font-mono">
                                  {cairoType}
                                </code>
                              </div>

                              {/* DATA Column */}
                              <div className="col-span-4">
                                <div className="flex items-center space-x-1">
                                  <code className="text-blue-600 text-xs font-mono break-all">
                                    {displayValue}
                                  </code>
                                  <CopyButton
                                    text={copyValue}
                                    fieldName={`func-arg-${index}-${argIndex}`}
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
                ) : (
                  // Fallback: raw arguments display
                  <div className="mt-1 max-h-32 overflow-y-auto">
                    {call.calldata.map((arg, argIndex) => (
                      <div
                        key={argIndex}
                        className="text-xs font-mono text-base-content/60 break-all"
                      >
                        [{argIndex}] {arg}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);
