import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTargetNetwork } from "./useTargetNetwork";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import {
  Abi,
  ExtractAbiEvent,
  ExtractAbiEventNames,
} from "abi-wan-kanabi/dist/kanabi";
import {
  CallData,
  createAbiParser,
  events as starknetEvents,
  hash,
  RpcProvider,
  WebSocketChannel,
} from "starknet";
import { composeEventFilterKeys } from "~~/utils/scaffold-stark/eventKeyFilter";
import { parseEventData } from "~~/utils/scaffold-stark/eventsData";
import { ContractAbi, ContractName } from "~~/utils/scaffold-stark/contract";
import { getSharedWebSocketChannel } from "~~/services/web3/websocket";

type OnEvent<T> = (event: T) => void;

export type WebSocketEventsConfig<
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
> = {
  contractName: TContractName;
  eventName: TEventName;
  fromBlock?: bigint;
  filters?: Record<string, unknown>;
  // If true, also enrich each event with optional block/tx/receipt via HTTP provider
  enrich?: boolean;
  enabled?: boolean;
  onEvent?: OnEvent<any>;
};

export const useWebSocketEvents = <
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
>({
  contractName,
  eventName,
  fromBlock,
  filters,
  enrich,
  enabled = true,
  onEvent,
}: WebSocketEventsConfig<TContractName, TEventName>) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const subscriptionRef = useRef<any>(null);
  const { targetNetwork } = useTargetNetwork();
  const { data: deployedContractData, isLoading: deployedContractLoading } =
    useDeployedContractInfo(contractName);

  const httpClient = useMemo(() => {
    return new RpcProvider({ nodeUrl: targetNetwork.rpcUrls.public.http[0] });
  }, [targetNetwork.rpcUrls.public.http]);

  const eventAbi = useMemo(() => {
    const matches = (deployedContractData?.abi as Abi)?.filter(
      (part) =>
        part.type === "event" &&
        part.name.split("::").slice(-1)[0] === (eventName as string),
    ) as ExtractAbiEvent<ContractAbi<TContractName>, TEventName>[];
    if (!matches?.length) return undefined;
    if (matches.length > 1)
      throw new Error(`Ambiguous event "${eventName as string}"`);
    return matches[0];
  }, [deployedContractData, deployedContractLoading]);

  const start = useCallback(async () => {
    if (!enabled || deployedContractLoading) {
      return;
    }
    if (!deployedContractData || !eventAbi) {
      return;
    }

    setIsLoading(true);
    try {
      const channel: WebSocketChannel | null =
        await getSharedWebSocketChannel(targetNetwork);
      if (!channel) {
        throw new Error("WebSocket channel unavailable");
      }

      console.log(
        "🔌 [useWebSocketEvents] WebSocket channel connected successfully",
      );

      const selector = hash.getSelectorFromName(eventName as string);
      let keys: string[][] = [[selector]];
      if (filters) {
        keys = keys.concat(
          composeEventFilterKeys(filters, eventAbi, deployedContractData.abi),
        );
      }
      keys = keys.slice(0, 16);

      const sub = await channel.subscribeEvents({
        // starknet.js expects contract_address
        contract_address: deployedContractData.address,
        keys,
        // If fromBlock is defined, begin there; otherwise provider default (latest)
        from_block:
          typeof fromBlock !== "undefined"
            ? { block_number: Number(fromBlock) }
            : undefined,
      } as any);
      subscriptionRef.current = sub;
      setIsConnected(true);

      sub.on(async (evt: any) => {
        console.log(
          "📡 [useWebSocketEvents] New event received via WebSocket:",
          evt,
        );
        const base = { event: eventAbi, log: evt } as any;
        if (!enrich) {
          setEvents((prev) => [base, ...prev]);
          onEvent?.(base);
          return;
        }
        // Optionally enrich via HTTP for details
        const [block, transaction, receipt] = await Promise.all([
          evt.block_hash
            ? httpClient.getBlockWithTxHashes(evt.block_hash)
            : Promise.resolve(null),
          evt.transaction_hash
            ? httpClient.getTransactionByHash(evt.transaction_hash)
            : Promise.resolve(null),
          evt.transaction_hash
            ? httpClient.getTransactionReceipt(evt.transaction_hash)
            : Promise.resolve(null),
        ]);
        const enriched = { ...base, block, transaction, receipt };
        setEvents((prev) => [enriched, ...prev]);
        onEvent?.(enriched);
      });
      // Some versions expose error on the subscription object via 'on' with type or throw via promise; guard loosely
    } catch (e: any) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [
    enabled,
    deployedContractData?.address,
    eventAbi,
    filters,
    fromBlock,
    targetNetwork,
  ]);

  useEffect(() => {
    start();
    return () => {
      const s = subscriptionRef.current;
      if (s) {
        try {
          s.unsubscribe();
        } catch {}
        subscriptionRef.current = null;
      }
      setIsConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    contractName,
    eventName,
    enabled,
    deployedContractData,
    eventAbi,
    deployedContractLoading,
  ]);

  const parsedEvents = useMemo(() => {
    if (!deployedContractData || !eventAbi) return [];
    return events.map((e) => {
      const logs = [JSON.parse(JSON.stringify(e.log))];
      const parsed = starknetEvents.parseEvents(
        logs,
        starknetEvents.getAbiEvents(deployedContractData.abi),
        CallData.getAbiStruct(deployedContractData.abi),
        CallData.getAbiEnum(deployedContractData.abi),
        createAbiParser(deployedContractData.abi),
      );
      const args = parsed.length ? parsed[0][eventAbi.name] : {};
      const { event: rawEvent, ...rest } = e;
      return {
        type: (rawEvent as any).members,
        args,
        parsedArgs: parseEventData(args, (rawEvent as any).members),
        ...rest,
      };
    });
  }, [events, deployedContractData, eventAbi]);

  return {
    isConnected,
    isLoading: isLoading || deployedContractLoading,
    error,
    events: parsedEvents,
  };
};
