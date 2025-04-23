import React from "react";
import { useTheme } from "next-themes";
import { BlockieAvatar } from "../BlockieAvatar";
import { burnerAccounts } from "@scaffold-stark/stark-burner";

interface BurnerWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBurner: (index: number) => void;
}

const BurnerWalletModal: React.FC<BurnerWalletModalProps> = ({
  isOpen,
  onClose,
  onSelectBurner,
}) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className={`bg-base-100 rounded-lg w-96 p-6 shadow-xl ${isDarkMode ? "border border-[#385183]" : "border border-gray-300"}`}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Choose account</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            ✕
          </button>
        </div>

        <div className="h-[300px] overflow-y-auto flex w-full flex-col gap-2">
          {burnerAccounts.map((burnerAcc, ix) => (
            <div key={burnerAcc.publicKey} className="w-full flex flex-col">
              <button
                className={`hover:bg-gradient-modal border rounded-md text-neutral py-[8px] pl-[10px] pr-16 flex items-center gap-4 ${
                  isDarkMode ? "border-[#385183]" : ""
                }`}
                onClick={() => onSelectBurner(ix)}
              >
                <BlockieAvatar address={burnerAcc.accountAddress} size={35} />
                {`${burnerAcc.accountAddress.slice(
                  0,
                  6,
                )}...${burnerAcc.accountAddress.slice(-4)}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BurnerWalletModal;
