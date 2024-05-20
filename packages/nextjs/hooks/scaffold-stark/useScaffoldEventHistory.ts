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
  parseParamWithType,
  UseScaffoldEventHistoryConfig,
} from "~~/utils/scaffold-stark/contract";
import { devnet } from "@starknet-react/chains";
import { useProvider } from "@starknet-react/core";
import { hash, RpcProvider } from "starknet";
import {
  isCairoBigInt,
  isCairoBool,
  isCairoByteArray,
  isCairoContractAddress,
  isCairoFelt,
  isCairoInt,
  isCairoTuple,
  isCairoU256,
} from "~~/utils/scaffold-stark/types";

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

  const readEvents = async (fromBlock?: bigint) => {
    setIsLoading(true);
    try {
      if (!deployedContractData) {
        throw new Error("Contract not found");
      }

      if (!enabled) {
        throw new Error("Hook disabled");
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
        const logs = (
          await publicClient.getEvents({
            chunk_size: 100,
            keys: [
              [hash.getSelectorFromName(event.name.split("::").slice(-1)[0])],
            ],
            address: deployedContractData?.address,
            from_block: { block_number: Number(fromBlock || fromBlockUpdated) },
            to_block: { block_number: blockNumber },
          })
        ).events;
        setFromBlockUpdated(BigInt(blockNumber + 1));

        const newEvents = [];
        for (let i = logs.length - 1; i >= 0; i--) {
          newEvents.push({
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
      const abiEvent = (deployedContractData.abi as Abi).find(
        (part) => part.type === "event" && part.name === eventName,
      ) as ExtractAbiEvent<ContractAbi<TContractName>, TEventName>;

      return events?.map((event) => addIndexedArgsToEvent(event, abiEvent));
    }
    return [];
  }, [deployedContractData, events, eventName]);

  return {
    data: eventHistoryData,
    isLoading: isLoading,
    error: error,
  };
};

export const addIndexedArgsToEvent = (event: any, abiEvent: any) => {
  const args: Record<string, any> = {};
  let keyIndex = 1; // Start after the event name hash
  let dataIndex = 0;

  const parseValue = (
    array: string[],
    index: number,
    type: string,
    isKey: boolean,
  ) => {
    if (isCairoByteArray(type)) {
      const size = parseInt(array[index], 16); // Number of elements in ByteArray
      const data = array.slice(index + 1, index + 1 + size);
      if (isKey) {
        keyIndex += index + 1 + size;
      } else {
        dataIndex += index + 1 + size;
      }

      return parseParamWithType(
        type,
        {
          data,
          pending_word: array[index + 1 + size],
          pending_word_len: parseInt(array[1 + (index + 1 + size)], 16),
        },
        true,
      );
    } else if (
      isCairoContractAddress(type) ||
      isCairoInt(type) ||
      isCairoBigInt(type) ||
      isCairoFelt(type) ||
      isCairoBool(type) ||
      isCairoTuple(type)
    ) {
      if (isKey) {
        keyIndex++;
      } else {
        dataIndex++;
      }
      return parseParamWithType(type, array[index], true);
    } else if (isCairoU256(type)) {
      const value = { low: array[index], high: array[index + 1] };
      if (isKey) {
        keyIndex += 2;
      } else {
        dataIndex += 2;
      }
      return parseParamWithType(type, value, true);
    }
    return array[index];
  };

  abiEvent.members.forEach(
    (member: { type: string; kind: string; name: string }) => {
      if (member.kind === "key") {
        args[member.name] = parseValue(
          event.log.keys,
          keyIndex,
          member.type,
          true,
        );
      } else if (member.kind === "data") {
        args[member.name] = parseValue(
          event.log.data,
          dataIndex,
          member.type,
          false,
        );
      }
    },
  );

  return {
    args,
    ...event,
  };
};
