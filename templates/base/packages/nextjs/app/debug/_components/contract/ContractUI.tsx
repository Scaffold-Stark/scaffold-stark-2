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
import { ContractName } from "~~/utils/scaffold-stark/contract";
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
  const { data: deployedContractData, isLoading: deployedContractLoading } =
    useDeployedContractInfo(contractName);

  const tabs = [
    { id: "read", label: "Read" },
    { id: "write", label: "Write" },
  ];

  if (deployedContractLoading) {
    return (
      <div className="mt-14">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!deployedContractData) {
    return (
      <p className="text-3xl mt-14">
        {`No contract found by the name of "${contractName}" on chain "${targetNetwork.name}"!`}
      </p>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-6 px-6 lg:px-10 lg:gap-12 w-full max-w-7xl my-0 ${className}`}
    >
      <div className="col-span-5 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
        <div className="col-span-1 flex flex-col">
          <div className="bg-transparent border-gradient rounded-[5px] px-6 lg:px-8 mb-6 space-y-1 py-4">
            <div className="flex">
              <div className="flex flex-col gap-1">
                <span className="font-bold">{contractName}</span>
                <Address address={deployedContractData.address} />
                <ClassHash
                  classHash={deployedContractData.classHash}
                  size="xs"
                />
                <div className="flex gap-1 items-center">
                  <span className="font-bold text-sm">Balance:</span>
                  <Balance
                    address={deployedContractData.address}
                    className="px-0 h-1.5 min-h-[0.375rem] text-network"
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
          <div className="bg-transparent border-gradient rounded-[5px] px-6 lg:px-8 py-4">
            <ContractVariables // TODO : there is no contract variables on starknet
              refreshDisplayVariables={refreshDisplayVariables}
              deployedContractData={deployedContractData}
            />
          </div>
        </div>

        <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
          <div className="tabs tabs-boxed border border-[#8A45FC] rounded-[5px] bg-transparent">
            {tabs.map((tab) => (
              <a
                key={tab.id}
                className={`tab h-10 ${activeTab === tab.id ? "tab-active !bg-[#8A45FC] !rounded-[5px] !text-white" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </a>
            ))}
          </div>
          <div className="z-10">
            <div className="rounded-[5px] border border-[#8A45FC] flex flex-col relative bg-component">
              <div className="p-5 divide-y divide-secondary">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
