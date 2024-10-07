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
import useScaffoldEthBalance from "~~/hooks/scaffold-stark/useScaffoldEthBalance";
import useScaffoldStrkBalance from "~~/hooks/scaffold-stark/useScaffoldStrkBalance";
import { useNativeCurrencyPrice } from "~~/hooks/scaffold-stark/useNativeCurrencyPrice";
import { useGlobalState } from "~~/services/store/store";
import { useSwitchNetwork } from "~~/hooks/scaffold-stark/useSwitchNetwork";
import { ContractName } from "~~/utils/scaffold-stark/contract";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";
import { InputBase, IntegerInput } from "~~/components/scaffold-stark/";
import { parseUnits } from "ethers";
import { Skeleton } from "@radix-ui/themes";

const HooksExample: React.FC = () => {
  const [contractName, setContractName] =
    useState<ContractName>("YourContract");
  const [newGreeting, setNewGreeting] = useState<string>("");
  const [amountEth, setAmountEth] = useState<string>("");
  const [fromBlock, setFromBlock] = useState<bigint>(0n);
  // Commented code for useSwitchNetwork hook
  //const [selectedNetwork, setSelectedNetwork] = useState<string>("mainnet");

  const convertToWei = (amount: string) => {
    try {
      const weiValue = parseUnits(amount, 18);
      const adjustedWeiValue = weiValue / BigInt(10 ** 18);
      return adjustedWeiValue.toString();
    } catch (error) {
      console.error("Invalid ETH amount:", error);
      return "0";
    }
  };

  const { data: contract, isLoading: isContractLoading } = useScaffoldContract({
    contractName: contractName as ContractName,
  });

  const { formatted: ethBalance, isLoading: isEthBalanceLoading } =
    useScaffoldEthBalance({
      address: contract?.address,
    });

  const { formatted: strkBalance, isLoading: isStrkBalanceLoading } =
    useScaffoldStrkBalance({
      address: contract?.address,
    });

  useNativeCurrencyPrice();
  const nativeCurrencyPrice = useGlobalState(
    (state) => state.nativeCurrencyPrice,
  );
  const strkCurrencyPrice = useGlobalState((state) => state.strkCurrencyPrice);

  const { targetNetwork } = useTargetNetwork();

  const weiAmount = convertToWei(amountEth);

  const weiAmountBigInt = BigInt(weiAmount);

  const { sendAsync: setGreetingMulti } = useScaffoldMultiWriteContract({
    calls: [
      createContractCall("Eth" as ContractName, "approve", [
        contract?.address,
        weiAmountBigInt,
      ]),
      createContractCall(contractName as ContractName, "set_greeting", [
        newGreeting,
        weiAmountBigInt,
      ]),
    ],
  });

  const { data: greeting, isLoading: isGreetingLoading } =
    useScaffoldReadContract({
      contractName: contractName as ContractName,
      functionName: "greeting",
      args: [],
      watch: true,
    });

  const { data: isPremium, isLoading: isPremiumLoading } =
    useScaffoldReadContract({
      contractName: contractName as ContractName,
      functionName: "premium",
      args: [],
    });

  const { data: greetingChangedEvents, isLoading: isEventLoading } =
    useScaffoldEventHistory({
      contractName: contractName as ContractName,
      eventName: "contracts::YourContract::YourContract::GreetingChanged",
      fromBlock,
      watch: true,
    });

  // Commented code for useSwitchNetwork hook
  // const { switchNetwork } = useSwitchNetwork();

  // const handleSwitchNetwork = async () => {
  //   try {
  //     await switchNetwork(selectedNetwork);
  //     console.log(`Switched to ${selectedNetwork}`);
  //   } catch (error) {
  //     console.error("Failed to switch network:", error);
  //   }
  // }

  const handleSetGreeting = async () => {
    try {
      await setGreetingMulti();
      console.log("ETH approved and greeting set successfully");
    } catch (error) {
      console.error("Failed to approve ETH and set greeting:", error);
    }
  };

  const { sendAsync: withdraw } = useScaffoldWriteContract({
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
        {/* Contract Info */}
        <div className="rounded-[5px] bg-base-100 border border-gradient p-4 relative shadow">
          <div className="trapeze"></div>
          <h2 className="text-xl font-semibold mb-4">
            Contract Information (<code>useScaffoldContract</code>)
          </h2>
          <div>
            {isContractLoading && <Skeleton />}
            {!isContractLoading && contract ? (
              <p className="break-words">Contract loaded: {contract.address}</p>
            ) : (
              <p>No contract loaded</p>
            )}
          </div>
        </div>
        {/* ETH Balance */}
        <div className="rounded-[5px] bg-base-100 border border-gradient p-4 relative shadow">
          <div className="trapeze"></div>
          <h2 className="text-xl font-semibold mb-4">
            Contract ETH Balance (<code>useScaffoldEthBalance</code>)
          </h2>
          {isEthBalanceLoading && <Skeleton />}
          {!isEthBalanceLoading && contract ? (
            <p>{ethBalance} ETH</p>
          ) : (
            <p>No contract loaded</p>
          )}
        </div>

        {/* STRK Balance */}
        <div className="rounded-[5px] bg-base-100 border border-gradient p-4 relative shadow">
          <div className="trapeze"></div>
          <h2 className="text-xl font-semibold mb-4">
            Contract STRK Balance (<code>useScaffoldStrkBalance</code>)
          </h2>
          {isStrkBalanceLoading && <Skeleton />}
          {!isStrkBalanceLoading && contract ? (
            <p>{strkBalance} STRK</p>
          ) : (
            <p>No contract loaded</p>
          )}
        </div>

        {/* Native Currency Price */}
        <div className="rounded-[5px] bg-base-100 border border-gradient p-4 relative shadow">
          <div className="trapeze"></div>
          <h2 className="text-xl font-semibold mb-4">
            Currency Price (<code>useNativeCurrencyPrice</code>)
          </h2>
          <p>ETH Price: ${nativeCurrencyPrice}</p>
          <p>STRK Price: ${strkCurrencyPrice}</p>
        </div>

        {/* Set Greeting */}
        <div className="rounded-[5px] bg-base-100 border border-gradient p-4 relative shadow">
          <div className="trapeze"></div>
          <h2 className="text-xl font-semibold mb-4">
            Set Greeting (<code>useScaffoldEventHistory</code>)
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              New Greeting:
            </label>
            <InputBase
              name="newGreeting"
              value={newGreeting}
              onChange={(newValue) => setNewGreeting(newValue)}
              placeholder="ByteArray new greeting"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Amount ETH:
            </label>
            <IntegerInput
              value={amountEth}
              onChange={(newValue) => setAmountEth(newValue.toString())}
              name="amountEth"
              placeholder="u256 amount_eth"
            />
          </div>
          <button
            onClick={handleSetGreeting}
            className="btn bg-gradient-dark btn-sm shadow-none border-none text-white"
          >
            Set Greeting
          </button>
        </div>

        {/* Current Greeting */}
        <div className="rounded-[5px] bg-base-100 border border-gradient p-4 relative shadow">
          <div className="trapeze"></div>
          <h2 className="text-xl font-semibold mb-4">
            Current Greeting (<code>useScaffoldReadContract</code>)
          </h2>
          <div>
            {isGreetingLoading && <Skeleton />}
            {!isGreetingLoading && greeting !== undefined ? (
              <p className="break-words">{`Greeting: ${greeting}`}</p>
            ) : (
              <p>No greeting set</p>
            )}
          </div>
        </div>

        {/* Premium Status */}
        <div className="rounded-[5px] bg-base-100 border border-gradient p-4 relative shadow">
          <div className="trapeze"></div>
          <h2 className="text-xl font-semibold mb-4">
            Premium Status (<code>useScaffoldReadContract</code>)
          </h2>
          <div>
            {isPremiumLoading && <Skeleton />}
            {!isPremiumLoading && isPremium !== undefined ? (
              <p>{`Premium: ${isPremium ? "Yes" : "No"}`}</p>
            ) : (
              <p>Unable to fetch premium status</p>
            )}
          </div>
        </div>

        {/* Withdraw */}
        <div className="rounded-[5px] bg-base-100 border border-gradient p-4 pb-8 md:pb-4 relative shadow">
          <div className="trapeze"></div>
          <h2 className="text-xl font-semibold mb-4">
            Withdraw (<code>useScaffoldWriteContract</code>)
          </h2>
          <button
            onClick={handleWithdraw}
            className="btn absolute bottom-4 bg-gradient-dark btn-sm shadow-none border-none text-white"
          >
            Withdraw
          </button>
        </div>

        {/* Network Info */}
        <div className="rounded-[5px] bg-base-100 border border-gradient p-4 relative shadow">
          <div className="trapeze"></div>
          <h2 className="text-xl font-semibold mb-4">
            Network Information (<code>useTargetNetwork</code>)
          </h2>
          <p>Current Network: {targetNetwork.name}</p>
        </div>

        {/* Switch Network
        <div className="rounded-[5px] bg-base-100 border border-gradient p-4 relative shadow">
          <div className="trapeze"></div>
          <h2 className="text-xl font-semibold mb-4">
            Switch Network (useSwitchNetwork)
          </h2>
          <select
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value)}
            className="select select-bordered w-full mb-4"
          >
            <option value="mainnet">Mainnet</option>
            <option value="testnet">Testnet</option>
            <option value="devnet">Devnet</option>
          </select>
          <button
            onClick={handleSwitchNetwork}
            className="btn bg-gradient-dark btn-sm shadow-none border-none text-white"
          >
            Switch Network
          </button>
        </div>     */}

        {/* Greeting Changed Events */}
        <div className="rounded-[5px] bg-base-100 border border-gradient p-4 relative shadow">
          <div className="trapeze"></div>
          <h2 className="text-xl font-semibold mb-4">
            Greeting Changed Events (<code>useScaffoldEventHistory</code>)
          </h2>
          <ol type="1">
            {greetingChangedEvents?.map((item, i) => (
              <li key={i} className="mt-2">
                <div>
                  <span className="font-semibold">New greeting: </span>{" "}
                  {item.args.new_greeting}
                </div>
                <div className="break-words">
                  <span className="font-semibold">Block hash: </span>{" "}
                  {item.block.block_hash}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};

export default HooksExample;
