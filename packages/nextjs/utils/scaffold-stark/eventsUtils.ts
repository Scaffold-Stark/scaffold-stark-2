import {
  Abi,
  CallData,
  RpcProvider,
  events as starknetEvents,
  createAbiParser,
} from "starknet";
import {
  ExtractAbiEvent,
  ExtractAbiEventNames,
} from "abi-wan-kanabi/dist/kanabi";
import { ContractAbi, ContractName } from "./contract";

export function resolveEventAbi<
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
>(abi: Abi | undefined, eventName: string) {
  const matches = (abi as Abi | undefined)?.filter(
    (part) =>
      part.type === "event" && part.name.split("::").slice(-1)[0] === eventName,
  ) as ExtractAbiEvent<ContractAbi<TContractName>, TEventName>[] | undefined;
  if (!matches || matches.length === 0) return undefined;
  if (matches.length > 1)
    throw new Error(`Ambiguous event "${String(eventName)}"`);
  return matches[0];
}

export function parseLogsArgs(abi: Abi, fullEventName: string, logs: any[]) {
  const cloned = logs.map((l) => JSON.parse(JSON.stringify(l)));
  const parsed = starknetEvents.parseEvents(
    cloned,
    starknetEvents.getAbiEvents(abi),
    CallData.getAbiStruct(abi),
    CallData.getAbiEnum(abi),
    createAbiParser(abi),
  );
  return parsed.length ? parsed[0][fullEventName] : {};
}

export async function enrichLog(
  client: RpcProvider,
  log: any,
  opts: { block?: boolean; transaction?: boolean; receipt?: boolean },
) {
  const [block, transaction, receipt] = await Promise.all([
    opts.block && log.block_hash !== null
      ? client.getBlockWithTxHashes(log.block_hash)
      : Promise.resolve(null),
    opts.transaction && log.transaction_hash !== null
      ? client.getTransactionByHash(log.transaction_hash)
      : Promise.resolve(null),
    opts.receipt && log.transaction_hash !== null
      ? client.getTransactionReceipt(log.transaction_hash)
      : Promise.resolve(null),
  ]);
  return { block, transaction, receipt };
}

export async function getLatestAcceptedBlockNumber(
  client: RpcProvider,
): Promise<bigint> {
  const latest = await client.getBlockLatestAccepted();
  return BigInt(latest.block_number);
}
