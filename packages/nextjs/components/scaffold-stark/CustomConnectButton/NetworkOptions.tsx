import { useTheme } from "next-themes";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/solid";
import { getNetworkColor, useSwitchNetwork } from "~~/hooks/scaffold-stark";
import { getTargetNetworks } from "~~/utils/scaffold-stark";
import { useAccount } from "@starknet-react/core";

type NetworkOptionsProps = {
  hidden?: boolean;
};

export const NetworkOptions = ({ hidden = false }: NetworkOptionsProps) => {
  const { switchNetwork } = useSwitchNetwork();
  const { chainId } = useAccount();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const allowedNetworks = getTargetNetworks();

  return (
    <>
      {allowedNetworks
        .filter((allowedNetwork) => allowedNetwork.id !== chainId)
        .map((allowedNetwork) => (
          <li key={allowedNetwork.id} className={hidden ? "hidden" : ""}>
            <button
              className="menu-item btn-sm !rounded-xl flex gap-3 py-3 whitespace-nowrap"
              type="button"
              onClick={() => switchNetwork(allowedNetwork.network)}
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
