import {
  ContractAbi,
  ContractName,
  UseScaffoldWatchContractEventConfig,
} from "~~/utils/scaffold-stark/contract";
import {
  Abi,
  ExtractAbiEvent,
  ExtractAbiEventNames,
} from "abi-wan-kanabi/dist/kanabi";
import { useDeployedContractInfo } from "./useDeployedContractInfo";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useProvider } from "@starknet-react/core";
import { useTargetNetwork } from "./useTargetNetwork";
import {
  CallData,
  createAbiParser,
  hash,
  RpcProvider,
  events as starknetEvents,
} from "starknet";
import { useInterval } from "usehooks-ts";
import { devnet } from "@starknet-react/chains";
import scaffoldConfig from "~~/scaffold.config";
import { parseEventData } from "~~/utils/scaffold-stark/eventsData";

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
  const [previousBlock, setPreviousBlock] = useState<number>();

  const { data: deployedContractData, isLoading: deployedContractLoading } =
    useDeployedContractInfo(contractName);
  const { provider } = useProvider();
  const { targetNetwork } = useTargetNetwork();

  const publicClient = useMemo(() => {
    return new RpcProvider({
      nodeUrl: targetNetwork.rpcUrls.public.http[0],
    });
  }, [targetNetwork.rpcUrls.public.http]);

  // Get back event full name
  const matchingAbiEvents = useMemo(() => {
    return (deployedContractData?.abi as Abi)?.filter(
      (part) =>
        part.type === "event" &&
        part.name.split("::").slice(-1)[0] === (eventName as string),
    ) as ExtractAbiEvent<ContractAbi<TContractName>, TEventName>[];
  }, [deployedContractData, deployedContractLoading]);

  if (matchingAbiEvents?.length === 0) {
    throw new Error(`Event ${eventName as string} not found in contract ABI`);
  }

  if (matchingAbiEvents?.length > 1) {
    throw new Error(
      `Ambiguous event "${eventName as string}". ABI contains ${matchingAbiEvents?.length} events with that name`,
    );
  }

  const eventAbi = matchingAbiEvents?.[0];
  const fullName = eventAbi?.name;

  const respondToEvents = useCallback(async () => {
    const blockNumber = (await publicClient.getBlockLatestAccepted())
      ?.block_number;

    setIsLoading(true);
    try {
      if (deployedContractLoading) {
        return;
      }

      if (!deployedContractData) {
        throw new Error("Contract not found");
      }

      const event = (deployedContractData?.abi as Abi).find(
        (part) => part?.type === "event" && part?.name === fullName,
      ) as ExtractAbiEvent<ContractAbi<TContractName>, TEventName>;

      if (!event) {
        throw new Error(`Event ${eventName} not found in contract ABI`);
      }

      let keys: string[][] = [[hash.getSelectorFromName(eventName)]];
      keys = keys.slice(0, MAX_EVENT_KEYS);

      const rawResponseObject = await publicClient.getEvents({
        chunk_size: 100,
        address: deployedContractData?.address,
        from_block: { block_number: blockNumber },
        keys,
      });

      if (!rawResponseObject) return;

      const logs = rawResponseObject.events;

      const eventsArray = [];
      for (const log of logs) {
        eventsArray.push({
          event,
          log: log,
          block:
            log.block_hash !== null
              ? await publicClient.getBlockWithTxHashes(log.block_hash)
              : null,
          transaction:
            log.transaction_hash !== null
              ? await publicClient.getTransactionByHash(log.transaction_hash)
              : null,
          receipt:
            log.transaction_hash !== null
              ? await publicClient.getTransactionReceipt(log.transaction_hash)
              : null,
        });
      }

      for (const event of eventsArray) {
        const log = [event?.log];
        const parsed = starknetEvents.parseEvents(
          log,
          starknetEvents.getAbiEvents(deployedContractData?.abi),
          CallData.getAbiStruct(deployedContractData?.abi),
          CallData.getAbiEnum(deployedContractData?.abi),
          createAbiParser(deployedContractData?.abi),
        );

        const args =
          parsed.length && parsed[0][fullName] ? parsed[0][fullName] : {};
        const { event: rawEvent, ...rest } = event;

        const responseObject = {
          type: (rawEvent as any).members,
          args,
          parsedArgs: parseEventData(args, (rawEvent as any).members),
          ...rest,
        };
        setPreviousBlock(responseObject.log.block_number);

        if (responseObject.log.block_number === previousBlock) return;
        onLogs(responseObject);
      }
    } catch (err: any) {
      console.error(err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [
    eventName,
    contractName,
    deployedContractData?.address,
    targetNetwork,
    onLogs,
  ]);

  useEffect(() => {
    respondToEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!deployedContractLoading) {
      respondToEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    provider,
    contractName,
    eventName,
    deployedContractLoading,
    deployedContractData,
  ]);

  useInterval(
    async () => {
      if (!deployedContractLoading) {
        respondToEvents();
      }
    },
    targetNetwork.id !== devnet.id ? scaffoldConfig.pollingInterval : 4_000,
  );

  return {
    isLoading: isLoading || deployedContractLoading,
    error: error,
  };
};
