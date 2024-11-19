import { NetworkOptions } from "./NetworkOptions";
import {
  ArrowLeftEndOnRectangleIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useDisconnect } from "@starknet-react/core";

export const WrongNetworkDropdown = () => {
  const { disconnect } = useDisconnect();

  return (
    <div className="dropdown dropdown-end mr-2">
      <label
        tabIndex={0}
        className="dropdown-toggle btn btn-error btn-sm gap-1"
      >
        <span>Wrong network</span>
        <ChevronDownIcon className="ml-2 h-6 w-4 sm:ml-0" />
      </label>

      <ul
        tabIndex={0}
        className="shadow-center menu dropdown-content mt-1 gap-1 rounded-box bg-base-200 p-2 shadow-accent"
      >
        {/* TODO: reinstate if needed */}
        {/* <NetworkOptions /> */}
        <li>
          <button
            className="menu-item btn-sm flex gap-3 !rounded-xl py-3 text-error"
            type="button"
            onClick={() => disconnect()}
          >
            <ArrowLeftEndOnRectangleIcon className="ml-2 h-6 w-4 sm:ml-0" />
            <span>Disconnect</span>
          </button>
        </li>
      </ul>
    </div>
  );
};
