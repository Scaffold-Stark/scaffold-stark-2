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
import { hash, RpcProvider } from "starknet";
import { useInterval } from "usehooks-ts";
import { devnet } from "@starknet-react/chains";
import scaffoldConfig from "~~/scaffold.config";

const MAX_EVENT_KEYS = 16;

export const useScaffoldWatchContractEvent = <
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
>({
  contractName,
  eventName,
  onLogs,
}: UseScaffoldWatchContractEventConfig<TContractName, TEventName>) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentBlockNumber, setCurrentBlockNumber] = useState(0);
  const [error, setError] = useState<Error | null>();

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
    setCurrentBlockNumber(blockNumber);

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

      const responseObject = await publicClient.getEvents({
        chunk_size: 100,
        address: deployedContractData?.address,
        from_block: { block_number: blockNumber },
        // to_block: {
        //   block_number: currentBlockNumber
        // },
        keys,
      });

      if (responseObject?.events?.length) {
        for (const log of responseObject.events) onLogs(log);
      }
    } catch (err: any) {
      console.error(err);
      setError(err);
    } finally {
      setIsLoading(false);
      const latestBlock = (await publicClient.getBlockLatestAccepted())
        ?.block_number;
      setCurrentBlockNumber(latestBlock + 1);
    }
  }, [eventName, contractName, deployedContractData?.address, targetNetwork, onLogs]);

  useEffect(() => {
    respondToEvents().then();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!deployedContractLoading) {
      respondToEvents().then();
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

  // useEffect(() => {
  //   let isMounted = true;
  //   // ... async operations
  //   return () => {
  //     isMounted = false;
  //   };
  // }, [dependencies]);

  return {
    isLoading: isLoading || deployedContractLoading,
    error: error
  }
};
