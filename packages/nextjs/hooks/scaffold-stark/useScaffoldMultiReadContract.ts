import {
  ContractAbi,
  ContractName,
  contracts,
  ExtractAbiFunctionNamesScaffold,
  UseScaffoldReadConfig,
  Contract,
  AbiFunctionOutputs,
} from "~~/utils/scaffold-stark/contract";
import { Abi, Address, useProvider } from "@starknet-react/core";
import {
  hash,
  CallData,
  Contract as StarknetContract,
  BlockNumber,
} from "starknet";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useTargetNetwork } from "./useTargetNetwork";
import { multicallAbi } from "~~/utils/Constants";
import { Tuple } from "~~/types/utils";

type ViewFunctionName<TContractName extends ContractName> =
  ExtractAbiFunctionNamesScaffold<ContractAbi<TContractName>, "view">;

type ScaffoldReadCall<
  TAbi extends Abi,
  TContractName extends ContractName,
  TFunctionName extends ViewFunctionName<TContractName>,
> = Pick<
  UseScaffoldReadConfig<TAbi, TContractName, TFunctionName>,
  "functionName" | "contractName" | "args"
>;

type ScaffoldReadResults<TCalls extends readonly any[]> = {
  readonly [K in keyof TCalls]: TCalls[K] extends {
    contractName: infer TContractName;
    functionName: infer TFunctionName;
  }
    ? TContractName extends ContractName
      ? TFunctionName extends ViewFunctionName<TContractName>
        ? AbiFunctionOutputs<ContractAbi<TContractName>, TFunctionName>
        : never
      : never
    : never;
};

type UseScaffoldMultiReadParams<
  TAbi extends Abi,
  TContractName extends ContractName,
  TFunctionName extends ViewFunctionName<TContractName>,
  TCall extends Tuple<ScaffoldReadCall<TAbi, TContractName, TFunctionName>>,
> = {
  calls: TCall;
  multicallAddress: Address;
  blockIdentifier?: BlockNumber;
  watch?: boolean;
  queryConfig?: Omit<
    UseQueryOptions<
      ScaffoldReadResults<TCall>,
      Error,
      ScaffoldReadResults<TCall>
    >,
    "queryKey" | "queryFn"
  >;
};

export const useScaffoldMultiReadContract = <
  TAbi extends Abi,
  TContractName extends ContractName,
  TFunctionName extends ViewFunctionName<TContractName>,
  TCall extends Tuple<ScaffoldReadCall<TAbi, TContractName, TFunctionName>>,
>(
  params: UseScaffoldMultiReadParams<TAbi, TContractName, TFunctionName, TCall>,
) => {
  const { calls, multicallAddress, blockIdentifier, watch, queryConfig } =
    params;

  const { enabled: enabledParam = true, ...restQueryConfig } =
    queryConfig || {};

  const { targetNetwork } = useTargetNetwork();
  const { provider: publicClient } = useProvider();
  const { id } = targetNetwork;

  const enabled = enabledParam && calls.length > 0;
  const queryKey = [
    "useScaffoldMultiReadContract",
    calls,
    id.toString(),
    blockIdentifier,
    watch,
  ];

  const queryFn = async () => {
    const parsedCalls = calls.map((c) => {
      const { functionName, contractName, args } = c;
      const contract = contracts?.[targetNetwork.network]?.[
        contractName as ContractName
      ] as Contract<TContractName>;

      if (!contract) {
        throw new Error(
          `Contract ${contractName} not found in deployed contracts`,
        );
      }

      const { abi, address } = contract;
      const callDataHelper = new CallData(abi);
      const rawArg = args ? callDataHelper.compile(functionName, args) : [];
      const fnSelector = hash.getSelectorFromName(functionName);

      return {
        address,
        callDataHelper,
        fnSelector,
        rawArg,
      };
    });

    const addresses = parsedCalls.map((call) => call.address);
    const fnSelectors = parsedCalls.map((call) => call.fnSelector);
    const rawArgs = parsedCalls.map((call) => call.rawArg);
    const callDataHelpers = parsedCalls.map((call) => call.callDataHelper);

    const multicallContract = new StarknetContract(
      multicallAbi,
      multicallAddress,
      publicClient,
    );
    const result = (await multicallContract.call(
      "call_contracts",
      [addresses, fnSelectors, rawArgs],
      {
        blockIdentifier,
      },
    )) as bigint[][];

    const parsedResults = result.map((raw, index) => {
      const { functionName } = calls[index];
      const callDataHelper = callDataHelpers[index];

      return callDataHelper.parse(
        functionName,
        raw.map((b) => b.toString()),
      );
    });

    return parsedResults as ScaffoldReadResults<TCall>;
  };

  return useQuery({
    ...restQueryConfig,
    queryKey,
    queryFn,
    enabled,
  });
};
