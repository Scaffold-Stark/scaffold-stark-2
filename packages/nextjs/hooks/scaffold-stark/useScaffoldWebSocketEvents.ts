import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTargetNetwork } from "./useTargetNetwork";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import { Abi, ExtractAbiEventNames } from "abi-wan-kanabi/dist/kanabi";
import { RpcProvider, WebSocketChannel } from "starknet";
import type { SubscribeEventsParams } from "starknet";
import { buildEventKeys } from "~~/utils/scaffold-stark/eventKeyFilter";
import { parseEventData } from "~~/utils/scaffold-stark/eventsData";
import {
  ContractAbi,
  ContractName,
  UseScaffoldWebSocketEventsConfig,
} from "~~/utils/scaffold-stark/contract";
import { getSharedWebSocketChannel } from "~~/services/web3/websocket";
import {
  enrichLog,
  resolveEventAbi,
  parseLogsArgs,
} from "~~/utils/scaffold-stark/eventsUtils";

export const useScaffoldWebSocketEvents = <
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
}: UseScaffoldWebSocketEventsConfig<TContractName, TEventName>) => {
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
    return resolveEventAbi<TContractName, TEventName>(
      deployedContractData?.abi as Abi,
      eventName as string,
    );
  }, [deployedContractData, deployedContractLoading, eventName]);

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
        "🔌 [useScaffoldWebSocketEvents] WebSocket channel connected successfully",
      );

      const keys = buildEventKeys(
        eventName as string,
        filters as any,
        eventAbi as any,
        deployedContractData.abi as any,
        16,
      );

      const params: SubscribeEventsParams = {
        fromAddress: deployedContractData.address,
        keys,
        blockIdentifier:
          typeof fromBlock !== "undefined" ? Number(fromBlock) : undefined,
      };
      const sub = await channel.subscribeEvents(params);
      subscriptionRef.current = sub;
      setIsConnected(true);

      sub.on(async (evt: any) => {
        console.log(
          "📡 [useScaffoldWebSocketEvents] New event received via WebSocket:",
          evt,
        );
        const base = { event: eventAbi, log: evt } as any;
        if (!enrich) {
          setEvents((prev) => [base, ...prev]);
          onEvent?.(base);
          return;
        }
        // Optionally enrich via HTTP for details
        const { block, transaction, receipt } = await enrichLog(
          httpClient,
          evt,
          {
            block: true,
            transaction: true,
            receipt: true,
          },
        );
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
      const args = parseLogsArgs(
        deployedContractData.abi as Abi,
        eventAbi.name,
        [e.log],
      );
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
