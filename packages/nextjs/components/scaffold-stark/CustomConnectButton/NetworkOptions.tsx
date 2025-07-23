import { useTheme } from "next-themes";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/solid";
import { getNetworkColor, useSwitchNetwork } from "~~/hooks/scaffold-stark";
import { getTargetNetworks } from "~~/utils/scaffold-stark";
import { useAccount, useSwitchChain } from "@starknet-react/core";
import { useEffect, useMemo } from "react";
import { constants } from "starknet";

type NetworkOptionsProps = {
  hidden?: boolean;
};

export const NetworkOptions = ({ hidden = false }: NetworkOptionsProps) => {
  const { switchChain, error: switchChainError } = useSwitchChain({});
  const { chainId } = useAccount();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const allowedNetworks = getTargetNetworks();

  useEffect(() => {
    if (switchChainError)
      console.error(`Error switching chains: ${switchChainError}`);
  }, [switchChainError]);

  // note: might need a cleaner solutiojn
  const allowedNetworksMapping = useMemo(() => {
    return Object.fromEntries(
      allowedNetworks.map((chain) => [chain.network, chain.id.toString(16)]),
    );
  }, [allowedNetworks]);

  return (
    <>
      {allowedNetworks
        .filter((allowedNetwork) => allowedNetwork.id !== chainId)
        .map((allowedNetwork) => (
          <li key={allowedNetwork.network} className={hidden ? "hidden" : ""}>
            <button
              className="menu-item btn-sm rounded-xl! flex gap-3 py-3 whitespace-nowrap"
              type="button"
              onClick={() =>
                switchChain({
                  chainId: allowedNetworksMapping[allowedNetwork.network],
                })
              }
            >
              <ArrowsRightLeftIcon className="h-6 w-4 ml-2 sm:ml-0" />
              <span>
                Switch to{" "}
                <span
                  style={{
                    color: getNetworkColor(allowedNetwork, isDarkMode),
                  }}
                >
                  {allowedNetwork.name}
                </span>
              </span>
            </button>
          </li>
        ))}
    </>
  );
};
