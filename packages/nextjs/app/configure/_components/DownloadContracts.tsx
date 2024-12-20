"use client";

import { useProvider } from "@starknet-react/core";
import { useCallback, useState } from "react";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";
import configExternalContracts from "~~/contracts/configExternalContracts";
import { deepMergeContracts } from "~~/utils/scaffold-stark/contract";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import prettier from "prettier/standalone";
import parserTypescript from "prettier/plugins/typescript";
import prettierPluginEstree from "prettier/plugins/estree";

export default function DownloadContracts() {
  const { provider } = useProvider();
  const [address, setAddress] = useState<string>("");

  const { targetNetwork } = useTargetNetwork();
  const [contractName, setContractName] = useState<string>("");

  const handleDownload = useCallback(async () => {
    if (!address) return;
    try {
      const [apiResponse, classHash] = await Promise.all([
        provider.getClassAt(address),
        provider.getClassHashAt(address),
      ]);

      const contractData = {
        [targetNetwork.network]: {
          [contractName]: {
            address,
            classHash,
            abi: apiResponse.abi,
          },
        },
      };
      const mergedPredeployedContracts = deepMergeContracts(
        contractData,
        configExternalContracts
      );

      generateContractsFile(mergedPredeployedContracts);
    } catch (error) {
      console.error(error);
      return;
    }
  }, [address, provider, contractName, targetNetwork.network]);

  const generateContractsFile = async (contractsData: Object) => {
    const generatedContractComment = `/**
* This file is autogenerated by Scaffold-Stark.
* You should not edit it manually or your changes might be overwritten.
*/`;

    const configExternalContracts = await prettier.format(
      `${generatedContractComment}\n\nconst configExternalContracts = ${JSON.stringify(
        contractsData
      )} as const;\n\nexport default configExternalContracts;`,
      {
        parser: "typescript",
        plugins: [parserTypescript, prettierPluginEstree],
      }
    );
    const blob = new Blob([configExternalContracts], {
      type: "text/typescript",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "configExternalContracts.ts";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-y-6 lg:gap-y-8 py-8 lg:py-12 justify-center items-center">
      <div className="p-6 px-8 mx-2 border-gradient rounded-[5px] w-full max-w-6xl contract-content">
        <div className="text-xl mb-2 font-bold">
          Fetch Contract Configuration File from Contract Address
        </div>
        <div className="flex flex-col gap-12 sm:gap-24 sm:flex-row">
          <div className="flex-1">
            <div className="font-bold my-3 text-lg">Instructions</div>
            <p className="my-2">
              This tool generate a contract configuration file by entering a
              contract address and name. The downloaded file can be used to
              replace your local{" "}
              <code className="text-function">configExternalContracts.ts</code>{" "}
              for debugging.
            </p>
            <ol className="flex flex-col gap-2 list-decimal list-outside my-6 space-y-1 ml-4">
              <li className="pl-3">Enter contract name and address</li>
              <li className="pl-3">
                Click{" "}
                <strong className="text-function">
                  Download Contract File
                </strong>
              </li>
              <li className="pl-3">
                Replace your{" "}
                <code className="text-function">
                  configExternalContracts.ts
                </code>{" "}
                file
              </li>
              <li className="pl-3">
                Debug your contract at{" "}
                <Link href={"/debug"} className="text-function">
                  <code>/debug</code>
                </Link>{" "}
                and use hooks with the downloaded contract
              </li>
            </ol>
          </div>
          <div className="flex-1 px-12">
            {targetNetwork && (
              <div className="my-4 flex text-md flex-col">
                <div className="w-24 mb-2 font-medium break-words text-function">
                  Network
                </div>
                <span>{targetNetwork.name}</span>
              </div>
            )}
            <div className="flex flex-col my-6">
              <div className="w-24 mb-2 font-medium break-words text-function">
                Contract
              </div>
              <input
                value={contractName}
                onChange={(e) => setContractName(e.target.value)}
                list="symbols"
                className="input bg-input input-ghost rounded-none focus-within:border-transparent focus:outline-none h-[2.2rem] min-h-[2.2rem] px-4 border w-full text-sm placeholder:text-[#9596BF] text-neutral"
                placeholder="Enter contract name"
              />
            </div>
            <div className="flex flex-col text-accent my-6">
              <div className="w-24 mb-2 font-medium break-words text-function">
                Address
              </div>
              <div className="flex flex-1 gap-4">
                <input
                  className="input bg-input input-ghost rounded-none focus-within:border-transparent focus:outline-none h-[2.2rem] min-h-[2.2rem] px-4 border w-full text-sm placeholder:text-[#9596BF] text-neutral"
                  type="text"
                  placeholder="Enter contract address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <button
                className="btn btn-sm mt-12 max-w-56 bg-gradient-nav !text-white shadow-md flex gap-2"
                onClick={handleDownload}
              >
                Download Contract File
                <span>
                  <ArrowDownTrayIcon
                    className="h-4 w-4 cursor-pointer"
                    aria-hidden="true"
                  />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
