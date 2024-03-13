"use client";

import {
  useAccount,
  useContract,
  useContractRead,
  useContractWrite,
} from "@starknet-react/core";
import { useEffect, useMemo, useState } from "react";
import { cairo } from "starknet";
import ConnectModal from "~~/src/app/components/wallet/ConnectModal";

export function DebugContracts() {
  const [openConnectModal, setOpenConnectModal] = useState(false);
  const { address } = useAccount();

  const toggleModal = () => {
    setOpenConnectModal((prev) => !prev);
  };
  useEffect(() => {
    if (openConnectModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [openConnectModal]);

  const abi = [
    {
      type: "function",
      name: "increase_balance",
      inputs: [{ name: "amount", type: "core::felt252" }],
      outputs: [],
      state_mutability: "external",
    },
    {
      type: "function",
      name: "get_balance",
      inputs: [],
      outputs: [{ type: "core::felt252" }],
      state_mutability: "view",
    },
  ];

  const { contract } = useContract({
    abi,
    address:
      "0x64274cacfc92d80807d70dc0a5a9e1ce6cf1d1c23f0e4bb48388027e7abab22",
  });

  const calls = useMemo(() => {
    if (!address || !contract) return [];
    return contract.populateTransaction["increase_balance"]!(1);
  }, [contract, address]);

  const {
    writeAsync,
    data: writeData,
    isPending,
  } = useContractWrite({
    calls,
    options: {
      maxFee: 99999999999999999,
      version: 1,
    },
  });

  const { data, isError, isLoading, error } = useContractRead({
    functionName: "get_balance",
    args: [],
    abi,
    address:
      "0x64274cacfc92d80807d70dc0a5a9e1ce6cf1d1c23f0e4bb48388027e7abab22",
    watch: true,
  });
  console.log(error);
  console.log(data);

  return (
    <div className="flex flex-col gap-y-6 lg:gap-y-8 py-8 lg:py-12 justify-center items-center">
      <div className="hidden md:flex gap-8">
        {address ? (
          <div className="flex justify-end">{address}</div>
        ) : (
          <button
            onClick={toggleModal}
            className="hidden md:block bg-blue-500 hover:bg-blue-700 text-white  py-2 px-4 rounded-full transition duration-300"
          >
            Connect
          </button>
        )}
      </div>
      <ConnectModal isOpen={openConnectModal} onClose={toggleModal} />
      <button>hola</button>
      <button
        onClick={() => {
          writeAsync();
        }}
      >
        {" "}
        execute tx{" "}
      </button>
    </div>
  );
}
