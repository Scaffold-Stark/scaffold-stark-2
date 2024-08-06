"use client";

import { useState } from "react";
import { useScaffoldContract } from "~~/hooks/scaffold-stark/useScaffoldContract";
import {
  createContractCall,
  useScaffoldMultiWriteContract,
} from "~~/hooks/scaffold-stark/useScaffoldMultiWriteContract";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark/useScaffoldReadContract";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-stark/useScaffoldEventHistory";
import { ContractName } from "~~/utils/scaffold-stark/contract";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";

const ExamplePage: React.FC = () => {
  const [contractName, setContractName] = useState<ContractName>("Eth");
  const [functionName, setFunctionName] = useState<string>("name");
  const [args, setArgs] = useState<string>("");
  const [readFunctionName, setReadFunctionName] = useState<string>("name");
  const [eventName, setEventName] = useState<string>("");
  const [fromBlock, setFromBlock] = useState<bigint>(0n);
  const [writeFunctionName, setWriteFunctionName] = useState<string>("");
  const [writeArgs, setWriteArgs] = useState<string>("");

  const { data: contract, isLoading: isContractLoading } = useScaffoldContract({
    contractName: contractName as ContractName,
  });

  const { targetNetwork } = useTargetNetwork();

  const { writeAsync: multiWrite } = useScaffoldMultiWriteContract({
    calls: [
      createContractCall(
        contractName as ContractName,
        functionName as any,
        args as any,
      ),
    ],
  });

  const {
    data: readData,
    isLoading: isReadLoading,
    error: readError,
  } = useScaffoldReadContract({
    contractName: contractName as ContractName,
    functionName: readFunctionName as any,
    args: [] as any,
  });

  const {
    data: eventData,
    isLoading: isEventLoading,
    error: eventError,
  } = useScaffoldEventHistory({
    contractName: contractName as ContractName,
    eventName: eventName as any,
    fromBlock,
    watch: true,
  });

  const handleMultiWrite = async () => {
    try {
      await multiWrite();
      console.log("MultiWrite operation successful");
    } catch (error) {
      console.error("MultiWrite operation failed:", error);
    }
  };

  const { writeAsync: singleWrite } = useScaffoldWriteContract({
    contractName: contractName as ContractName,
    functionName: writeFunctionName as any,
    args: writeArgs as any,
  });

  const handleSingleWrite = async () => {
    try {
      await singleWrite();
      console.log("SingleWrite operation successful");
    } catch (error) {
      console.error("SingleWrite operation failed:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Scaffold Custom Hooks Example</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-[5px] bg-white border border-[#8A45FC] p-4  shadow">
          <h2 className="text-xl font-semibold mb-4">Contract Configuration</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contract Name:
            </label>
            <div className="flex">
              <input
                type="text"
                value={contractName}
                onChange={(e) =>
                  setContractName(e.target.value as ContractName)
                }
                className="w-full px-3 py-2 border rounded-l-md"
              />
            </div>
          </div>
          <div>
            {isContractLoading ? (
              <p>Loading contract...</p>
            ) : contract ? (
              <p className="break-words">Contract loaded: {contract.address}</p>
            ) : (
              <p>No contract loaded</p>
            )}
          </div>
        </div>

        <div className="rounded-[5px] bg-white border border-[#8A45FC] p-4  shadow">
          <h2 className="text-xl font-semibold mb-4">
            useScaffoldMultiWriteContract
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Function Name:
            </label>
            <input
              type="text"
              value={functionName}
              onChange={(e) => setFunctionName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arguments (comma-separated):
            </label>
            <input
              type="text"
              value={args}
              onChange={(e) => setArgs(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <button
            onClick={handleMultiWrite}
            className="btn bg-gradient-dark btn-sm shadow-none border-none text-white"
          >
            Execute MultiWrite
          </button>
        </div>

        <div className="rounded-[5px] bg-white border border-[#8A45FC] p-4  shadow">
          <h2 className="text-xl font-semibold mb-4">
            useScaffoldReadContract
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Read Function Name:
            </label>
            <input
              type="text"
              value={readFunctionName}
              onChange={(e) => setReadFunctionName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            {isReadLoading ? (
              <p>Loading data...</p>
            ) : readData !== undefined ? (
              <p className="break-words">{`Read data: ${readData}`}</p>
            ) : (
              <p>No data</p>
            )}
          </div>
        </div>

        <div className="rounded-[5px] bg-white border border-[#8A45FC] p-4  shadow">
          <h2 className="text-xl font-semibold mb-4">
            useScaffoldEventHistory
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Name:
            </label>
            <input
              type="text"
              value={eventName}
              placeholder="yourEventName"
              onChange={(e) => setEventName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Block:
            </label>
            <input
              type="number"
              value={fromBlock.toString()}
              onChange={(e) => setFromBlock(BigInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            {isEventLoading ? (
              <p>Loading events...</p>
            ) : eventData ? (
              <div>
                <p>Events found: {eventData.length}</p>
                <ul>
                  {eventData.map((event: any, index: number) => (
                    <li key={index}>
                      Event {index + 1}: {JSON.stringify(event.args)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>No events found</p>
            )}
          </div>
        </div>

        <div className="rounded-[5px] bg-white border border-[#8A45FC] p-4  shadow">
          <h2 className="text-xl font-semibold mb-4">Network Information</h2>
          <p>Current Network: {targetNetwork.name}</p>
          <p>Network ID: {targetNetwork.id}</p>
        </div>
        <div className="rounded-[5px] bg-white border border-[#8A45FC] p-4 shadow">
          <h2 className="text-xl font-semibold mb-4">
            useScaffoldWriteContract
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Write Function Name:
            </label>
            <input
              type="text"
              value={writeFunctionName}
              onChange={(e) => setWriteFunctionName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arguments (comma-separated):
            </label>
            <input
              type="text"
              value={writeArgs}
              onChange={(e) => setWriteArgs(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <button
            onClick={handleSingleWrite}
            className="btn bg-gradient-dark btn-sm shadow-none border-none text-white"
          >
            Execute SingleWrite
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamplePage;
