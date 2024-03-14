"use client";

import {
  useAccount,
  useBlockNumber,
  useContract,
  useContractRead,
  useContractWrite,
} from "@starknet-react/core";
import { useEffect, useMemo, useState } from "react";
import { BlockNumber, cairo } from "starknet";
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
    address: "0xb9bd302ae1daa17403c9dc5534b230deebf912f23724883cff9f739bf48903",
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
  });

  const { data, isError, isLoading, error } = useContractRead({
    functionName: "get_balance",
    args: [],
    abi,
    address: "0xb9bd302ae1daa17403c9dc5534b230deebf912f23724883cff9f739bf48903",
    blockIdentifier: "pending" as BlockNumber,
    refetchInterval: 3000,
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
      <button>Execute increaase 1</button>
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
