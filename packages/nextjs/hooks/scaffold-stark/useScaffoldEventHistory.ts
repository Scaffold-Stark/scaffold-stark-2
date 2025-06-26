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
import { useWebsocket } from "~~/context/WebsocketContext";

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
  isWebsocket = false,
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

  const {
    wsChannelRef,
    subscriptionIdRef,
    createWsChannel,
    cleanUpWebsocket,
    isWebsocketConnected,
    setIsWebsocketConnected,
  } = useWebsocket();

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

  const wsUrl = useMemo(() => {
    if (!isWebsocket) return;

    const url = targetNetwork.rpcUrls.public.websocket?.[0];
    if (!url) return "";
    return url;
  }, [targetNetwork, isWebsocket]);

  const websocketReadEvents = useCallback(
    async (fromBlock?: bigint) => {
      if (!enabled || !isWebsocket || !deployedContractData) return;

      setIsLoading(true);

      try {
        const wsChannel = await createWsChannel();
        if (!wsChannel) {
          throw new Error("Error in connection");
        }

        const event = (deployedContractData.abi as Abi).find(
          (part) => part.type === "event" && part.name === eventName,
        ) as ExtractAbiEvent<ContractAbi<TContractName>, TEventName>;

        if (!event) {
          throw new Error(`Event ${eventName} not found in contract ABI`);
        }

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

          const subscriptionId = await wsChannel.subscribeEvents(
            deployedContractData.address,
            keys,
            fromBlock || blockNumber,
          );

          if (!subscriptionId) {
            throw new Error(`Failed to subscribeEvents`);
          }

          subscriptionIdRef.current = subscriptionId;

          wsChannel.onEvents = async (data) => {
            console.log("New ws event entry: ", data);

            if (data.result) {
              const log = data.result;

              const responseObject = {
                event: (deployedContractData.abi as Abi).find(
                  (part) => part.type === "event" && part.name === eventName,
                ),
                log,
                block:
                  blockData && log?.block_hash !== null
                    ? await publicClient.getBlockWithTxHashes(log.block_hash)
                    : null,
                transaction:
                  transactionData && log.transaction_hash !== null
                    ? await publicClient.getTransactionByHash(
                        log.transaction_hash,
                      )
                    : null,
                receipt:
                  receiptData && log.transaction_hash !== null
                    ? await publicClient.getTransactionReceipt(
                        log.transaction_hash,
                      )
                    : null,
              };

              setEvents((prev) =>
                [responseObject, ...(prev || [])].slice(0, 100),
              );
            }
          };

          wsChannel.onClose = async (ev) => {
            console.log("Web socket channel closed: ", ev);
            setIsWebsocketConnected(false);
            await new Promise((resolve) => setTimeout(resolve, 5000));
            if (enabled) websocketReadEvents();
          };

          wsChannel.onError = (ev) => {
            console.error("Websocket connection error: ", ev);
            setError("Websocket connection error");
            setIsWebsocketConnected(false);
          };
          setError(undefined);
        }
      } catch (err: any) {
        console.error(err);
        setEvents(undefined);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    },
    [isWebsocket, wsUrl, deployedContractData, enabled, eventName, filters],
  );

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

        // await processNewEvents(logs);
        const newEvents: any[] = [];
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
          setEvents((prev) => {
            const combined = [...newEvents, ...events];
            return combined.slice(0, MAX_EVENTS_LIMIT);
          });
        } else {
          setEvents(newEvents.slice(0, MAX_EVENTS_LIMIT));
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

  // effect for the history using useWebhook
  useEffect(() => {
    if (
      !isWebsocket ||
      !deployedContractData ||
      !enabled ||
      deployedContractLoading
    )
      return;

    websocketReadEvents();

    return () => {
      cleanUpWebsocket();
    };
  }, [
    isWebsocket,
    deployedContractData,
    deployedContractLoading,
    websocketReadEvents,
    cleanUpWebsocket,
  ]);

  useEffect(() => {
    if (
      isWebsocket ||
      !deployedContractData ||
      !enabled ||
      deployedContractLoading
    )
      return;
    readEvents(fromBlock).then();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    fromBlock,
    enabled,
    isWebsocket,
    deployedContractData,
    deployedContractLoading,
  ]);

  useEffect(() => {
    if (!deployedContractLoading && enabled && !fromBlock && !isWebsocket) {
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
    isWebsocket,
  ]);

  useEffect(() => {
    // Reset the internal state when target network or fromBlock changed
    setEvents([]);
    setFromBlockUpdated(fromBlock);
    setError(undefined);

    if (isWebsocket) {
      cleanUpWebsocket();
    }
  }, [fromBlock, targetNetwork.id]);

  useInterval(
    async () => {
      if (!deployedContractLoading && !isWebsocket) {
        readEvents();
      }
    },
    !isWebsocket && watch
      ? targetNetwork.id !== devnet.id
        ? scaffoldConfig.pollingInterval
        : 4_000
      : null,
  );

  const eventHistoryData = useMemo(() => {
    if (!deployedContractData) return [];
    return (events || []).map((event) => {
      const logs = [event.log];
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
  }, [deployedContractData, events, eventName, format]);

  return {
    data: eventHistoryData,
    isLoading: isLoading || deployedContractLoading,
    error: error,
    isWebsocketConnected,
    isUsingWebsocket: isWebsocket,
  };
};
