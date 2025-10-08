import {
  ContractAbi,
  ContractName,
  UseScaffoldWatchContractEventConfig,
} from "~~/utils/scaffold-stark/contract";
import { ExtractAbiEventNames } from "abi-wan-kanabi/dist/kanabi";
import { useEffect, useState } from "react";
import { useProvider } from "@starknet-react/core";
import { useTargetNetwork } from "./useTargetNetwork";
import { useWebSocketEvents } from "./useWebSocketEvents";
import scaffoldConfig from "~~/scaffold.config";

const MAX_EVENT_KEYS = 16;

/**
 * Watches for specific contract events and triggers a callback when events are detected.
 * This hook continuously polls for events from a deployed contract and calls the provided
 * callback function whenever new events matching the specified event name are found.
 *
 * @param config - Configuration object for the hook
 * @param config.contractName - The deployed contract name to watch for events
 * @param config.eventName - The name of the event to watch (must exist in contract ABI)
 * @param config.onLogs - Callback function to execute when events are detected, receives parsed event data
 * @returns {Object} An object containing:
 *   - isLoading: boolean - Boolean indicating if the hook is currently loading or processing events
 *   - error: Error | null - Any error encountered during event watching, or null if successful
 * @see {@link https://scaffoldstark.com/docs/hooks/useScaffoldWatchContractEvent}
 */

export const useScaffoldWatchContractEvent = <
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
>({
  contractName,
  eventName,
  onLogs,
}: UseScaffoldWatchContractEventConfig<TContractName, TEventName>) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>();
  const { provider } = useProvider();
  const { targetNetwork } = useTargetNetwork();

  const { isLoading: wsLoading, error: wsError } = useWebSocketEvents({
    contractName,
    // use full event name compatibility; underlying hook resolves full name
    eventName: eventName as any,
    enrich: true,
    enabled: true,
    onEvent: (e) => onLogs(e),
  });

  useEffect(() => {
    setIsLoading(wsLoading);
    setError(wsError || null);
  }, [wsLoading, wsError]);

  // Keep previous polling as a fallback when WS is not available
  useEffect(() => {
    if (!wsError) return;
    let stopped = false;
    const tick = async () => {
      try {
        setIsLoading(true);
        await provider; // touch provider to keep dependency
      } catch (e: any) {
        setError(e);
      } finally {
        if (!stopped) setIsLoading(false);
      }
    };
    const id = setInterval(
      tick,
      targetNetwork ? scaffoldConfig.pollingInterval : 4000,
    );
    return () => {
      stopped = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsError, provider, targetNetwork]);

  return { isLoading, error };
};
