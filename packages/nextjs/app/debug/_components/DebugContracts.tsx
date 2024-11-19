"use client";

import { useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";
import { ContractUI } from "~~/app/debug/_components/contract";
import { ContractName } from "~~/utils/scaffold-stark/contract";
import { getAllContracts } from "~~/utils/scaffold-stark/contractsData";

const selectedContractStorageKey = "scaffoldStark2.selectedContract";
const contractsData = getAllContracts();
const contractNames = Object.keys(contractsData) as ContractName[];

export function DebugContracts() {
  const [selectedContract, setSelectedContract] = useLocalStorage<ContractName>(
    selectedContractStorageKey,
    contractNames[0],
    { initializeWithValue: false },
  );

  useEffect(() => {
    if (!contractNames.includes(selectedContract)) {
      setSelectedContract(contractNames[0]);
    }
  }, [selectedContract, setSelectedContract]);

  return (
    <div className="flex flex-col items-center justify-center gap-y-6 py-8 lg:gap-y-8 lg:py-12">
      {contractNames.length === 0 ? (
        <p className="mt-14 text-3xl">No contracts found!</p>
      ) : (
        <>
          {contractNames.length > 1 && (
            <div className="flex w-full max-w-7xl flex-row flex-wrap gap-2 px-6 pb-1 lg:px-10">
              {contractNames.map((contractName) => (
                <button
                  className={`btn btn-secondary btn-sm font-light hover:border-transparent ${
                    contractName === selectedContract
                      ? "no-animation bg-secondary text-white hover:bg-secondary"
                      : "bg-transparent text-neutral hover:text-white"
                  }`}
                  key={contractName}
                  onClick={() => setSelectedContract(contractName)}
                >
                  {contractName}
                </button>
              ))}
            </div>
          )}
          {contractNames.map((contractName) => (
            <ContractUI
              key={contractName}
              contractName={contractName}
              className={contractName === selectedContract ? "" : "hidden"}
            />
          ))}
        </>
      )}
    </div>
  );
}
