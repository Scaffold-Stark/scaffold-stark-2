import { useEffect, useMemo, useState } from "react";
import { useTargetNetwork } from "./useTargetNetwork";
import { useInterval } from "usehooks-ts";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import scaffoldConfig from "~~/scaffold.config";
import { replacer } from "~~/utils/scaffold-stark/common";
import {
  Abi,
  ExtractAbiEvent,
  ExtractAbiEventNames,
} from "abi-wan-kanabi/dist/kanabi";
import {
  ContractAbi,
  ContractName,
  UseScaffoldEventHistoryConfig,
} from "~~/utils/scaffold-stark/contract";
import { devnet } from "@starknet-react/chains";
import { useProvider } from "@starknet-react/core";
import { hash, RpcProvider } from "starknet";
import { events as starknetEvents, CallData } from "starknet";
import { parseEventData } from "~~/utils/scaffold-stark/eventsData";
import { composeEventFilterKeys } from "~~/utils/scaffold-stark/eventKeyFilter";

const MAX_KEYS_COUNT = 16;
/**
 * Reads historical events from a deployed contract.
 * This hook fetches and parses events from a specific block onwards, with optional
 * filtering, data inclusion, and continuous watching capabilities.
 *
 * @param config - Configuration object for the hook, typed with generics for contract and event names
 * @param {TContractName} config.contractName - The deployed contract name to read events from
 * @param {TEventName} config.eventName - The name of the event to read (must exist in contract ABI)
 * @param {bigint} config.fromBlock - The block number to start reading events from
 * @param {Object} [config.filters] - Optional filters to apply to events (parameterName: value)
 * @param {boolean} [config.blockData=false] - If true, includes block data for each event (default: false)
 * @param {boolean} [config.transactionData=false] - If true, includes transaction data for each event (default: false)
 * @param {boolean} [config.receiptData=false] - If true, includes receipt data for each event (default: false)
 * @param {boolean} [config.watch=false] - If true, continuously watches for new events (default: false)
 * @param {boolean} [config.format=true] - If true, formats the event data (default: true)
 * @param {boolean} [config.enabled=true] - If false, disables the hook (default: true)
 * @returns {Object} An object containing:
 *   - data: Array<EventData> | undefined - Array of parsed event data with type, args, parsedArgs (if format is true), and optional block/transaction/receipt data if respective flags are enabled
 *   - isLoading: boolean - Boolean indicating if the hook is loading or processing events
 *   - error: string | undefined - Any error encountered during event reading, or undefined if successful
 * @see {@link https://scaffoldstark.com/docs/hooks/useScaffoldEventHistory}
 */
export const useScaffoldEventHistory = <
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
  TBlockData extends boolean = false,
  TTransactionData extends boolean = false,
  TReceiptData extends boolean = false,
>({
  contractName,
  eventName,
  fromBlock,
  filters,
  blockData,
  transactionData,
  receiptData,
  watch,
  format = true,
  enabled = true,
}: UseScaffoldEventHistoryConfig<
  TContractName,
  TEventName,
  TBlockData,
  TTransactionData,
  TReceiptData
>) => {
  const [events, setEvents] = useState<any[]>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [fromBlockUpdated, setFromBlockUpdated] = useState<bigint>(fromBlock);

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
  // const matchingAbiEvents =

  if (matchingAbiEvents?.length === 0) {
    throw new Error(`Event ${eventName as string} not found in contract ABI`);
  }

  if (matchingAbiEvents?.length > 1) {
    throw new Error(
      `Ambiguous event "${eventName as string}". ABI contains ${matchingAbiEvents.length} events with that name`,
    );
  }

  const eventAbi = matchingAbiEvents?.[0];
  const fullName = eventAbi?.name;

  const readEvents = async (fromBlock?: bigint) => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      if (deployedContractLoading) {
        return;
      }

      if (!deployedContractData) {
        throw new Error("Contract not found");
      }

      const event = (deployedContractData.abi as Abi).find(
        (part) =>
          part.type === "event" &&
          part.name.split("::").slice(-1)[0] === eventName,
      ) as ExtractAbiEvent<ContractAbi<TContractName>, TEventName>;

      const blockNumber = (await publicClient.getBlockLatestAccepted())
        .block_number;

      if (
        (fromBlock && blockNumber >= fromBlock) ||
        blockNumber >= fromBlockUpdated
      ) {
        let keys: string[][] = [[hash.getSelectorFromName(eventName)]];
        if (filters) {
          keys = keys.concat(
            composeEventFilterKeys(filters, event, deployedContractData.abi),
          );
        }
        keys = keys.slice(0, MAX_KEYS_COUNT);
        const rawEventResp = await publicClient.getEvents({
          chunk_size: 100,
          keys,
          address: deployedContractData?.address,
          from_block: { block_number: Number(fromBlock || fromBlockUpdated) },
          to_block: { block_number: blockNumber },
        });
        if (!rawEventResp) {
          return;
        }
        const logs = rawEventResp.events;
        setFromBlockUpdated(BigInt(blockNumber + 1));

        const newEvents = [];
        for (let i = logs.length - 1; i >= 0; i--) {
          newEvents.push({
            event,
            log: logs[i],
            block:
              blockData && logs[i].block_hash === null
                ? null
                : await publicClient.getBlockWithTxHashes(logs[i].block_hash),
            transaction:
              transactionData && logs[i].transaction_hash !== null
                ? await publicClient.getTransactionByHash(
                    logs[i].transaction_hash,
                  )
                : null,
            receipt:
              receiptData && logs[i].transaction_hash !== null
                ? await publicClient.getTransactionReceipt(
                    logs[i].transaction_hash,
                  )
                : null,
          });
        }
        if (events && typeof fromBlock === "undefined") {
          setEvents([...newEvents, ...events]);
        } else {
          setEvents(newEvents);
        }
        setError(undefined);
      }
    } catch (e: any) {
      console.error(e);
      setEvents(undefined);
      setError(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    readEvents(fromBlock).then();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromBlock, enabled]);

  useEffect(() => {
    if (!deployedContractLoading) {
      readEvents().then();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    provider,
    contractName,
    eventName,
    deployedContractLoading,
    deployedContractData?.address,
    deployedContractData,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filters, replacer),
    blockData,
    transactionData,
    receiptData,
  ]);

  useEffect(() => {
    // Reset the internal state when target network or fromBlock changed
    setEvents([]);
    setFromBlockUpdated(fromBlock);
    setError(undefined);
  }, [fromBlock, targetNetwork.id]);

  useInterval(
    async () => {
      if (!deployedContractLoading) {
        readEvents();
      }
    },
    watch
      ? targetNetwork.id !== devnet.id
        ? scaffoldConfig.pollingInterval
        : 4_000
      : null,
  );

  const eventHistoryData = useMemo(() => {
    if (deployedContractData) {
      return (events || []).map((event) => {
        const logs = [JSON.parse(JSON.stringify(event.log))];
        const parsed = starknetEvents.parseEvents(
          logs,
          starknetEvents.getAbiEvents(deployedContractData.abi),
          CallData.getAbiStruct(deployedContractData.abi),
          CallData.getAbiEnum(deployedContractData.abi),
        );
        const args = parsed.length ? parsed[0][fullName] : {};
        const { event: rawEvent, ...rest } = event;
        return {
          type: rawEvent.members,
          args,
          parsedArgs: format ? parseEventData(args, rawEvent.members) : null,
          ...rest,
        };
      });
    }
    return [];
  }, [deployedContractData, events, eventName, format]);

  return {
    data: eventHistoryData,
    isLoading: isLoading || deployedContractLoading,
    error: error,
  };
};
