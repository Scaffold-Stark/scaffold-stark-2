import {
  ContractAbi,
  ContractName,
  contracts,
  ExtractAbiFunctionNamesScaffold,
  UseScaffoldReadConfig,
  Contract,
} from "~~/utils/scaffold-stark/contract";
import {
  Abi,
  Address,
  useProvider,
  UseReadContractProps,
} from "@starknet-react/core";
import {
  hash,
  CallData,
  Contract as StarknetContract,
  BlockIdentifier,
  BlockNumber,
  Result,
} from "starknet";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useTargetNetwork } from "./useTargetNetwork";
import { multicallAbi } from "~~/utils/Constants";

type ScaffoldReadCall<
  TAbi extends Abi,
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNamesScaffold<
    ContractAbi<TContractName>,
    "view"
  >,
> = Pick<
  UseScaffoldReadConfig<TAbi, TContractName, TFunctionName>,
  "functionName" | "contractName" | "args"
>;

type UseScaffoldMultiReadProps<
  TAbi extends Abi,
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNamesScaffold<
    ContractAbi<TContractName>,
    "view"
  >,
> = {
  calls: Array<ScaffoldReadCall<TAbi, TContractName, TFunctionName>>;
  multicallAddress: Address;
  blockIdentifier?: BlockNumber;
  watch?: boolean;
  queryConfig?: Omit<
    UseQueryOptions<unknown, Error, Result[]>,
    "queryKey" | "queryFn"
  >;
};

export const useScaffoldMultiReadContract = <
  TAbi extends Abi,
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNamesScaffold<
    ContractAbi<TContractName>,
    "view"
  >,
>(
  props: UseScaffoldMultiReadProps<TAbi, TContractName, TFunctionName>,
) => {
  const { calls, multicallAddress, blockIdentifier, watch, queryConfig } =
    props;
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
  const queryFn = async (): Promise<Result[]> => {
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

    const parsedResult = result.map((raw, index) => {
      const { functionName } = calls[index];
      const callDataHelper = callDataHelpers[index];
      const parsedData = callDataHelper.parse(
        functionName,
        raw.map((b) => b.toString()),
      );

      return parsedData;
    });

    return parsedResult;
  };

  return useQuery({
    ...restQueryConfig,
    queryKey,
    queryFn,
    enabled,
  });
};
