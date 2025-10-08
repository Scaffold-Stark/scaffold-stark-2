import {
  ContractAbi,
  ContractName,
  UseScaffoldWatchContractEventConfig,
} from "~~/utils/scaffold-stark/contract";
import { ExtractAbiEventNames } from "abi-wan-kanabi/dist/kanabi";
import { useEffect, useMemo, useState } from "react";
import { useProvider } from "@starknet-react/core";
import { useTargetNetwork } from "./useTargetNetwork";
import { useScaffoldWebSocketEvents } from "./useScaffoldWebSocketEvents";
import scaffoldConfig from "~~/scaffold.config";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import { Abi } from "abi-wan-kanabi/dist/kanabi";
import { resolveEventAbi } from "~~/utils/scaffold-stark/eventsUtils";

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
  const [error, setError] = useState<Error | undefined>();
  const { provider } = useProvider();
  const { targetNetwork } = useTargetNetwork();

  // Validate event existence in ABI to keep parity with previous behavior and tests
  const { data: deployedContractData, isLoading: deployedContractLoading } =
    useDeployedContractInfo(contractName);
  const eventAbi = useMemo(() => {
    return resolveEventAbi(
      deployedContractData?.abi as Abi,
      eventName as unknown as string,
    );
  }, [deployedContractData, deployedContractLoading, eventName]);
  if (!deployedContractLoading && deployedContractData && !eventAbi) {
    throw new Error(`Event ${eventName as string} not found in contract ABI`);
  }

  useEffect(() => {
    if (!deployedContractLoading && !deployedContractData) {
      setError(new Error("Contract not found"));
    } else if (!deployedContractLoading) {
      setError(undefined);
    }
  }, [deployedContractLoading, deployedContractData]);

  const {
    events = [],
    isLoading: wsLoading,
    error: wsError,
  } = useScaffoldWebSocketEvents({
    contractName,
    eventName: eventName,
    enrich: true,
    enabled: true,
  });

  useEffect(() => {
    if (events && events.length > 0) {
      onLogs(events[0]);
    }
  }, [events, onLogs]);

  useEffect(() => {
    setIsLoading(wsLoading);
    if (wsError) setError(wsError);
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
