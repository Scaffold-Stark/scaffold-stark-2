import {
  ChevronDownIcon,
  ArrowLeftEndOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useDisconnect } from "@starknet-react/core";
import { notification } from "~~/utils/scaffold-stark";
import { useLocalStorage } from "usehooks-ts";

export const WrongNetworkDropdown = () => {
  const { disconnect } = useDisconnect();
  const [, setWasDisconnectedManually] = useLocalStorage<boolean>(
    "wasDisconnectedManually",
    false,
  );

  const handleDisconnect = () => {
    try {
      disconnect();
      localStorage.removeItem("lastConnectionTime");
      setWasDisconnectedManually(true);
      window.dispatchEvent(new Event("manualDisconnect"));
      notification.success("Disconnect successfully!");
    } catch (err) {
      console.error(err);
      notification.success("Disconnect failure!");
    }
  };

  return (
    <div className="dropdown dropdown-end mr-2">
      <label
        tabIndex={0}
        className="btn btn-error btn-sm dropdown-toggle gap-1"
      >
        <span>Wrong network</span>
        <ChevronDownIcon className="h-6 w-4 ml-2 sm:ml-0" />
      </label>

      <ul
        tabIndex={0}
        className="dropdown-content menu p-2 mt-1 shadow-center shadow-accent bg-base-200 rounded-box gap-1"
      >
        {/* TODO: reinstate if needed */}
        {/* <NetworkOptions /> */}
        <li>
          <button
            className="menu-item text-error btn-sm rounded-xl! flex gap-3 py-3"
            type="button"
            onClick={handleDisconnect}
          >
            <ArrowLeftEndOnRectangleIcon className="h-6 w-4 ml-2 sm:ml-0" />
            <span>Disconnect</span>
          </button>
        </li>
      </ul>
    </div>
  );
};
