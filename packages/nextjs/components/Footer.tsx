import { Cog8ToothIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";
import { useGlobalState } from "~~/services/store/store";
import { devnet, sepolia, mainnet } from "@starknet-react/chains";
import { Faucet } from "~~/components/scaffold-stark/Faucet";
import { FaucetSepolia } from "~~/components/scaffold-stark/FaucetSepolia";
import { BlockExplorerSepolia } from "./scaffold-stark/BlockExplorerSepolia";
import { BlockExplorer } from "./scaffold-stark/BlockExplorer";
import Link from "next/link";

/**
 * Site footer
 */
export const Footer = () => {
  const nativeCurrencyPrice = useGlobalState(
    (state) => state.nativeCurrencyPrice,
  );
  const { targetNetwork } = useTargetNetwork();

  // NOTE: workaround - check by name also since in starknet react devnet and sepolia has the same chainId
  const isLocalNetwork =
    targetNetwork.id === devnet.id && targetNetwork.network === devnet.network;
  const isSepoliaNetwork =
    targetNetwork.id === sepolia.id &&
    targetNetwork.network === sepolia.network;
  const isMainnetNetwork =
    targetNetwork.id === mainnet.id &&
    targetNetwork.network === mainnet.network;

  return (
    <div className="mb-11 min-h-0 bg-base-100 px-1 py-5 lg:mb-0">
      <div>
        <div className="pointer-events-none fixed bottom-0 left-0 z-10 flex w-full items-center justify-between p-4">
          <div className="pointer-events-auto flex flex-col gap-2 md:flex-row">
            {isSepoliaNetwork && (
              <>
                <FaucetSepolia />
                <BlockExplorerSepolia />
              </>
            )}
            {isLocalNetwork && (
              <>
                <Faucet />
              </>
            )}
            {isMainnetNetwork && (
              <>
                <BlockExplorer />
              </>
            )}
            <Link
              href={"/configure"}
              passHref
              className="btn btn-sm cursor-pointer gap-1 border border-[#32BAC4] font-normal shadow-none"
            >
              <Cog8ToothIcon className="h-4 w-4 text-[#32BAC4]" />
              <span>Configure Contracts</span>
            </Link>
            {nativeCurrencyPrice > 0 && (
              <div>
                <div className="btn btn-sm cursor-auto gap-1 border border-[#32BAC4] font-normal shadow-none">
                  <CurrencyDollarIcon className="h-4 w-4 text-[#32BAC4]" />
                  <span>{nativeCurrencyPrice}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="w-full">
        <ul className="menu menu-horizontal w-full">
          <div className="flex w-full items-center justify-center gap-2 text-sm">
            <div className="text-center">
              <a
                href="https://github.com/Scaffold-Stark/scaffold-stark-2"
                target="_blank"
                rel="noreferrer"
                className="link"
              >
                Fork me
              </a>
            </div>

            <div className="text-center">
              <a
                href="https://t.me/+wO3PtlRAreo4MDI9"
                target="_blank"
                rel="noreferrer"
                className="link"
              >
                Support
              </a>
            </div>
          </div>
        </ul>
      </div>
    </div>
  );
};
