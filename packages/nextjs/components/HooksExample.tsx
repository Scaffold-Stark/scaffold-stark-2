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

const HooksExample: React.FC = () => {
  const [contractName, setContractName] = useState<ContractName>("YourContract");
  const [newGreeting, setNewGreeting] = useState<string>("");
  const [amountEth, setAmountEth] = useState<string>("");
  const [fromBlock, setFromBlock] = useState<bigint>(0n);

  const { data: contract, isLoading: isContractLoading } = useScaffoldContract({
    contractName: contractName as ContractName,
  });

  const { targetNetwork } = useTargetNetwork();

  const { writeAsync: setGreetingMulti } = useScaffoldMultiWriteContract({
    calls: [
      createContractCall(
        contractName as ContractName,
        "set_gretting",
        [newGreeting, BigInt(amountEth)],
      ),
    ],
  });

  const {
    data: greeting,
    isLoading: isGreetingLoading,
    error: greetingError,
  } = useScaffoldReadContract({
    contractName: contractName as ContractName,
    functionName: "gretting",
		args: []
  });

  const {
    data: isPremium,
    isLoading: isPremiumLoading,
    error: premiumError,
  } = useScaffoldReadContract({
    contractName: contractName as ContractName,
    functionName: "premium",
  });

  const {
    data: greetingChangedEvents,
    isLoading: isEventLoading,
    error: eventError,
  } = useScaffoldEventHistory({
    contractName: contractName as ContractName,
    eventName: "GreetingChanged",
    fromBlock,
    watch: true,
  });

  
  const handleSetGreeting = async () => {
    try {
      await setGreetingMulti();
      console.log("Greeting set successfully");
    } catch (error) {
      console.error("Failed to set greeting:", error);
    }
  };

  const { writeAsync: withdraw } = useScaffoldWriteContract({
    contractName: contractName as ContractName,
    functionName: "withdraw",

  });

  const handleWithdraw = async () => {
    try {
      await withdraw();
      console.log("Withdrawal successful");
    } catch (error) {
      console.error("Withdrawal failed:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">YourContract Example</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-[5px] bg-white border border-[#8A45FC] p-4 relative shadow">
					<div className="trapeze"></div>
          <h2 className="text-xl font-semibold mb-4">Contract Information (useScaffoldContract)</h2>
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

        <div className="rounded-[5px] bg-white border border-[#8A45FC] p-4 relative shadow">
					<div className="trapeze"></div>
          <h2 className="text-xl font-semibold mb-4">Set Greeting (useScaffoldEventHistory)</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Greeting:
            </label>
            <input
              type="text"
              value={newGreeting}
              onChange={(e) => setNewGreeting(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount ETH:
            </label>
            <input
              type="text"
              value={amountEth}
              onChange={(e) => setAmountEth(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <button
            onClick={handleSetGreeting}
            className="btn bg-gradient-dark btn-sm shadow-none border-none text-white"
          >
            Set Greeting
          </button>
        </div>

        <div className="rounded-[5px] bg-white border border-[#8A45FC] p-4 relative shadow">
					<div className="trapeze"></div>
          <h2 className="text-xl font-semibold mb-4">Current Greeting (useScaffoldReadContract)</h2>
          <div>
            {isGreetingLoading ? (
              <p>Loading greeting...</p>
            ) : greeting !== undefined ? (
              <p className="break-words">{`Greeting: ${greeting}`}</p>
            ) : (
              <p>No greeting set</p>
            )}
          </div>
        </div>

        <div className="rounded-[5px] bg-white border border-[#8A45FC] p-4 relative shadow">
					<div className="trapeze"></div>
          <h2 className="text-xl font-semibold mb-4">Premium Status (useScaffoldReadContract)</h2>
          <div>
            {isPremiumLoading ? (
              <p>Loading premium status...</p>
            ) : isPremium !== undefined ? (
              <p>{`Premium: ${isPremium ? "Yes" : "No"}`}</p>
            ) : (
              <p>Unable to fetch premium status</p>
            )}
          </div>
        </div>

        <div className="rounded-[5px] bg-white border border-[#8A45FC] p-4 relative shadow">
					<div className="trapeze"></div>
          <h2 className="text-xl font-semibold mb-4">Withdraw (useScaffoldWriteContract)</h2>
          <button
            onClick={handleWithdraw}
            className="btn absolute bottom-4 bg-gradient-dark btn-sm shadow-none border-none text-white"
          >
            Withdraw
          </button>
        </div>

        <div className="rounded-[5px] bg-white border border-[#8A45FC] p-4 shadow">
          <h2 className="text-xl font-semibold mb-4">Network Information (useTargetNetwork)</h2>
          <p>Current Network: {targetNetwork.name}</p>
        </div>
      </div>
    </div>
  );
};

export default HooksExample;