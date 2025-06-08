import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { hash, RpcProvider, WebSocketChannel } from "starknet";
import { events as starknetEvents, CallData } from "starknet";
import { parseEventData } from "~~/utils/scaffold-stark/eventsData";
import { composeEventFilterKeys } from "~~/utils/scaffold-stark/eventKeyFilter";

const MAX_KEYS_COUNT = 16;
const MAX_EVENTS_LIMIT = 100;
/**
 * Reads events from a deployed contract
 * @param config - The config settings
 * @param config.contractName - deployed contract name
 * @param config.eventName - name of the event to listen for
 * @param config.fromBlock - the block number to start reading events from
 * @param config.filters - filters to be applied to the event (parameterName: value)
 * @param config.blockData - if set to true it will return the block data for each event (default: false)
 * @param config.transactionData - if set to true it will return the transaction data for each event (default: false)
 * @param config.receiptData - if set to true it will return the receipt data for each event (default: false)
 * @param config.watch - if set to true, the events will be updated every pollingInterval milliseconds set at scaffoldConfig (default: false)
 * @param config.enabled - if set to false, disable the hook from running (default: true)
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
  useWebsocket = false,
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
  const [isWebsocketConnected, setIsWebsocketConnected] = useState(false);

  const webSocketChannelRef = useRef<WebSocketChannel | null>(null);
  const subscriptionIdRef = useRef<string | null>(null);
  const processingRef = useRef<boolean>(false)

  const { data: deployedContractData, isLoading: deployedContractLoading } =
    useDeployedContractInfo(contractName);
  const { provider } = useProvider();
  const { targetNetwork } = useTargetNetwork();

  const publicClient = useMemo(() => {
    return new RpcProvider({
      nodeUrl: targetNetwork.rpcUrls.public.http[0],
    });
  }, [targetNetwork.rpcUrls.public.http]);

  const wsUrl = useMemo(() => {
    if (!useWebsocket) return;

    const url = targetNetwork.rpcUrls.public.websocket?.[0];
    return url || null;
  }, [targetNetwork.rpcUrls.public.websocket]);

  const processNewEvents = useCallback(
    async (newLogs: any[]) => {
      if (!deployedContractData || processingRef.current || newLogs.length === 0) return;

      // const newEvents: any[] = [];

      // for (let i = newLogs.length - 1; i >= 0; i--) {
      //   const log = newLogs[i];

      //   newEvents.push({
      //     event: (deployedContractData.abi as Abi).find(
      //       (part) => part.type === "event" && part.name === eventName,
      //     ),
      //     log,
      //     block:
      //       blockData && log.block_hash !== null
      //         ? await publicClient.getBlockWithTxHashes(log.block_hash)
      //         : null,
      //     transaction:
      //       transactionData && log.transaction_hash !== null
      //         ? await publicClient.getTransactionByHash(log.transaction_hash)
      //         : null,
      //     receipt:
      //       receiptData && log.transaction_hash !== null
      //         ? await publicClient.getTransactionReceipt(log.transaction_hash)
      //         : null,
      //   });
      // }
      processingRef.current = true;

      try {
        const batchSize = 10;
        const processedEvents: any[] = [];

        for (let i = 0; i < newLogs.length; i += batchSize) {
          const batch = newLogs.slice(i, batchSize + i);

          const batchEvents = await Promise.all(batch.map(async log => {
            try {
              const [block, transaction, receipt] = await Promise.all([
                blockData && log.block_hash ? publicClient.getBlockWithTxHashes(log.block_hash) : null,
                transactionData && log.transaction_hash ? publicClient.getTransactionByHash(log.transaction_hash) : null,
                receiptData && log.transaction_hash ? publicClient.getTransactionReceipt(log.transaction_hash) : null
              ])

              const event = (deployedContractData.abi as Abi).find(
                (part) => part.type === "event" && part.name === eventName
              )

              return { event, log, block, transaction, receipt };
            } catch (err) {
              console.warn("Error processing event: ", err);
              return null;
            }
          }));

          processedEvents.push(...batchEvents.filter(event => event !== null));
        }

        setEvents(prev => {
          const combined = [...processedEvents, prev];
          return combined.slice(0, MAX_EVENTS_LIMIT);
        });
      } catch (err) {
        console.error("Error processing events: ", err);
        setError(`Error processing events: ${err}`);
      } finally {
        processingRef.current = false;
      }

      // const newEvents = await Promise.all(newLogs.map(async log => {
      //   const [block, transaction, receipt] = await Promise.all([
      //     blockData && log.block_hash ? publicClient.getBlockWithTxHashes(log.block_hash) : null,
      //     transactionData && log.transaction_hash ? publicClient.getTransactionByHash(log.transaction_hash) : null,
      //     receiptData && log.transaction_hash ? publicClient.getTransactionReceipt(log.transaction_hash) : null
      //   ])

      //   const event = (deployedContractData.abi as Abi).find(
      //     (part) => part.type === "event" && part.name === eventName
      //   )

      //   return { event, log, block, transaction, receipt };
      // }))

      // setEvents((prev) => [...newEvents, ...(prev || [])]);
      // setEvents(prev => {
      //   const combined = [...newEvents, ...(prev || [])];
      //   return combined.slice(0, 100);
      // });
    },
    [
      deployedContractData,
      eventName,
      blockData,
      transactionData,
      receiptData,
      publicClient,
    ],
  );

  const cleanUpWebsocket = useCallback(async () => {
    if (webSocketChannelRef.current) {
      try {
        if (subscriptionIdRef.current) {
          await webSocketChannelRef.current.unsubscribeEvents();
          subscriptionIdRef.current = null;
        }

        webSocketChannelRef.current.disconnect();
        webSocketChannelRef.current = null;
        setIsWebsocketConnected(false);
      } catch (err) {
        console.error("Error cleaning up websocket: ", err);
      }
    }
  }, []);

  const initializeWebSocket = useCallback(async () => {
    if (!useWebsocket || !wsUrl || !deployedContractData || !enabled) return;

    try {
      if (!webSocketChannelRef.current) {
        // TODO: Implement this function
        await cleanUpWebsocket();
      }

      const wsChannel = new WebSocketChannel({
        nodeUrl: wsUrl,
      });

      await wsChannel.waitForConnection();
      webSocketChannelRef.current = wsChannel;
      setIsWebsocketConnected(true);

      const event = (deployedContractData.abi as Abi).find(
        (part) => part.type === "event" && part.name === eventName,
      ) as ExtractAbiEvent<ContractAbi<TContractName>, TEventName>;

      if (!event) {
        throw new Error(`Event: ${eventName} not found in contract ABI`);
      }

      let keys: string[][] = [
        [hash.getSelectorFromName(event.name.split("::").slice(-1)[0])],
      ];

      if (filters) {
        keys = keys.concat(
          composeEventFilterKeys(filters, event, deployedContractData.abi),
        );
      }

      keys = keys.slice(0, MAX_KEYS_COUNT);

      const blockNumber = (await publicClient.getBlockLatestAccepted())
        .block_number;

      const subscriptionId = await wsChannel.subscribeEvents(
        deployedContractData.address,
        keys,
        fromBlock || blockNumber,
      );

      if (!subscriptionId) {
        throw new Error("Failed to initialize websocket connection");
      }

      subscriptionIdRef.current = subscriptionId;

      wsChannel.onEvents = async (data) => {
        console.log("New ws event entry: ", data);

        if (data.result) {
          await processNewEvents([data.result]);
        }
      };

      wsChannel.onClose = (ev) => {
        console.log("Web socket channel closed: ", ev);
        setIsWebsocketConnected(false);
        setError("Websocket connection closed");
      };

      wsChannel.onError = (ev) => {
        console.error("Websocket connection error: ", ev);
        setError("Websocket connection error");
        setIsWebsocketConnected(false);
      };

      setError(undefined);
    } catch (err: any) {
      console.error("Failed to initialize websocket: ", err);
      setError(`Websocket Initialization failed: ${err.message}`);
      setIsWebsocketConnected(false);
    }
  }, [
    useWebsocket,
    wsUrl,
    deployedContractData,
    enabled,
    eventName,
    filters,
    processNewEvents,
  ]);

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
        (part) => part.type === "event" && part.name === eventName,
      ) as ExtractAbiEvent<ContractAbi<TContractName>, TEventName>;

      const blockNumber = (await publicClient.getBlockLatestAccepted())
        .block_number;

      if (
        (fromBlock && blockNumber >= fromBlock) ||
        blockNumber >= fromBlockUpdated
      ) {
        let keys: string[][] = [
          [hash.getSelectorFromName(event.name.split("::").slice(-1)[0])],
        ];
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

        await processNewEvents(logs);
        // const newEvents = [];
        // for (let i = logs.length - 1; i >= 0; i--) {
        //   newEvents.push({
        //     event,
        //     log: logs[i],
        //     block:
        //       blockData && logs[i].block_hash === null
        //         ? null
        //         : await publicClient.getBlockWithTxHashes(logs[i].block_hash),
        //     transaction:
        //       transactionData && logs[i].transaction_hash !== null
        //         ? await publicClient.getTransactionByHash(
        //             logs[i].transaction_hash,
        //           )
        //         : null,
        //     receipt:
        //       receiptData && logs[i].transaction_hash !== null
        //         ? await publicClient.getTransactionReceipt(
        //             logs[i].transaction_hash,
        //           )
        //         : null,
        //   });
        // }
        // if (events && typeof fromBlock === "undefined") {
        //   setEvents([...newEvents, ...events]);
        // } else {
        //   setEvents(newEvents);
        // }
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
    if (useWebsocket && !deployedContractLoading && deployedContractData) {
      initializeWebSocket();
    }

    return () => {
      if (useWebsocket) {
        cleanUpWebsocket();
      }
    };
  }, [
    useWebsocket,
    deployedContractData,
    deployedContractLoading,
    initializeWebSocket,
    cleanUpWebsocket,
  ]);

  useEffect(() => {
    if (!useWebsocket) {
      readEvents(fromBlock).then();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromBlock, enabled, useWebsocket]);

  useEffect(() => {
    if (!useWebsocket && !deployedContractLoading && deployedContractData && enabled) {
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
    useWebsocket,
  ]);

  useEffect(() => {
    // Reset the internal state when target network or fromBlock changed
    setEvents([]);
    setFromBlockUpdated(fromBlock);
    setError(undefined);
    processingRef.current = false;

    if (useWebsocket) {
      cleanUpWebsocket().then(() => {
        if (deployedContractData) {
          initializeWebSocket();
        }
      });
    } else if (!deployedContractLoading && deployedContractData && enabled) {
      readEvents(fromBlock);
    }
  }, [
    fromBlock,
    targetNetwork.id,
    useWebsocket,
    cleanUpWebsocket,
    deployedContractData,
    initializeWebSocket,
  ]);

  useInterval(
    async () => {
      if (!useWebsocket && !deployedContractLoading && !processingRef.current) {
        readEvents();
      }
    },
    !useWebsocket && watch
      ? targetNetwork.id !== devnet.id
        ? scaffoldConfig.pollingInterval
        : 4_000
      : null,
  );

  const eventHistoryData = useMemo(() => {
    if (!deployedContractData) return []
    // if (deployedContractData) {
      
    // }
    return (events || []).map((event) => {
        // const logs = [JSON.parse(JSON.stringify(event.log))];
      const logs = [event.log]
      const parsed = starknetEvents.parseEvents(
        logs,
        starknetEvents.getAbiEvents(deployedContractData.abi),
        CallData.getAbiStruct(deployedContractData.abi),
        CallData.getAbiEnum(deployedContractData.abi),
      );
      const args = parsed.length ? parsed[0][eventName] : {};
      const { event: rawEvent, ...rest } = event;
      return {
        type: rawEvent.members,
        args,
        parsedArgs: format ? parseEventData(args, rawEvent.members) : null,
        ...rest,
      };
    });
  }, [deployedContractData, events, eventName, format]);

  return {
    data: eventHistoryData,
    isLoading: isLoading || deployedContractLoading,
    error: error,
    isWebsocketConnected: useWebsocket ? isWebsocketConnected : undefined,
    isUsingWebsocket: useWebsocket,
  };
};
