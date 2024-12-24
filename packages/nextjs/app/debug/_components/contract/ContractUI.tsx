"use client";

// @refresh reset
import { useReducer, useState } from "react";
import dynamic from "next/dynamic";
import { ContractReadMethods } from "./ContractReadMethods";
import { Address, Balance } from "~~/components/scaffold-stark";
import {
  useDeployedContractInfo,
  useNetworkColor,
} from "~~/hooks/scaffold-stark";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";
import {
  ContractCodeStatus,
  ContractName,
} from "~~/utils/scaffold-stark/contract";
import { ContractVariables } from "./ContractVariables";
import { ClassHash } from "~~/components/scaffold-stark/ClassHash";

const ContractWriteMethods = dynamic(
  () =>
    import("./ContractWriteMethods").then((mod) => mod.ContractWriteMethods),
  {
    loading: () => <p>Loading Write Methods...</p>,
  },
);

type ContractUIProps = {
  contractName: ContractName;
  className?: string;
};

/**
 * UI component to interface with deployed contracts.
 **/
export const ContractUI = ({
  contractName,
  className = "",
}: ContractUIProps) => {
  const [activeTab, setActiveTab] = useState("read");
  const [refreshDisplayVariables, triggerRefreshDisplayVariables] = useReducer(
    (value) => !value,
    false,
  );
  const { targetNetwork } = useTargetNetwork();
  const {
    raw: deployedContractData,
    isLoading: deployedContractLoading,
    status,
  } = useDeployedContractInfo(contractName);

  const tabs = [
    { id: "read", label: "Read" },
    { id: "write", label: "Write" },
  ];

  if (status === ContractCodeStatus.NOT_FOUND) {
    return (
      <p className="mt-14 text-3xl">
        {`No contract found by the name of "${contractName}" on chain "${targetNetwork.name}"!`}
      </p>
    );
  }

  return (
    <div
      className={`my-0 grid w-full max-w-7xl grid-cols-1 px-6 lg:grid-cols-6 lg:gap-12 lg:px-10 ${className}`}
    >
      <div className="col-span-5 grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
        <div className="col-span-1 flex flex-col">
          <div className="border-gradient mb-6 space-y-1 rounded-[5px] bg-transparent px-6 py-4 lg:px-8">
            <div className="flex">
              <div className="flex flex-col gap-1">
                <span className="font-bold">{contractName}</span>
                <Address address={deployedContractData.address} />
                <ClassHash
                  classHash={deployedContractData.classHash}
                  size="xs"
                />
                <div className="flex h-5 items-center gap-1">
                  <span className="text-sm font-bold">Balance:</span>
                  <Balance
                    address={deployedContractData.address}
                    className="text-network h-1.5 min-h-[0.375rem] px-0"
                  />
                </div>
              </div>
            </div>
            {targetNetwork && (
              <p className="my-0 text-sm">
                <span className="font-bold">Network</span>:{" "}
                <span className="text-network">{targetNetwork.name}</span>
              </p>
            )}
          </div>
          <div className="border-gradient rounded-[5px] bg-transparent px-6 py-4 lg:px-8">
            <ContractVariables // TODO : there is no contract variables on starknet
              refreshDisplayVariables={refreshDisplayVariables}
              deployedContractData={deployedContractData}
            />
          </div>
        </div>

        <div className="col-span-1 flex flex-col gap-6 lg:col-span-2">
          <div className="tabs-boxed tabs rounded-[5px] border border-[#8A45FC] bg-transparent">
            {tabs.map((tab) => (
              <a
                key={tab.id}
                className={`tab h-10 ${
                  activeTab === tab.id
                    ? "tab-active !rounded-[5px] !bg-[#8A45FC] !text-white"
                    : ""
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </a>
            ))}
          </div>
          <div className="z-10">
            <div className="bg-component relative flex flex-col rounded-[5px] border border-[#8A45FC]">
              <div className="divide-y divide-secondary p-5">
                {activeTab === "read" && (
                  <ContractReadMethods
                    deployedContractData={deployedContractData}
                  />
                )}
                {activeTab === "write" && (
                  <ContractWriteMethods
                    deployedContractData={deployedContractData}
                    onChange={triggerRefreshDisplayVariables}
                  />
                )}
              </div>
              {deployedContractLoading && (
                <div className="absolute inset-0 z-10 rounded-[5px] bg-white/20">
                  <div className="absolute right-4 top-4 h-4 w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
