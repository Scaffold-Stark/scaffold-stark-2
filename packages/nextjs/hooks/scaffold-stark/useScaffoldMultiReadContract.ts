import {
  ContractAbi,
  ContractName,
  contracts,
  ExtractAbiFunctionNamesScaffold,
  UseScaffoldReadConfig,
  Contract,
} from "~~/utils/scaffold-stark/contract";
import { Abi, UseReadContractProps } from "@starknet-react/core";
import { hash, CallData } from "starknet";
import { useTargetNetwork } from "./useTargetNetwork";
import { useMemo } from "react";
import { useScaffoldReadContract } from "./useScaffoldReadContract";

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

type UseScaffoldMultiReadConfig = Omit<
  UseReadContractProps<Abi, "view">,
  "address" | "abi" | "functionName" | "args" | "chainId"
>;

type UseScaffoldMultiReadProps<
  TAbi extends Abi,
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNamesScaffold<
    ContractAbi<TContractName>,
    "view"
  >,
> = UseScaffoldMultiReadConfig & {
  calls: Array<ScaffoldReadCall<TAbi, TContractName, TFunctionName>>;
};

export const useScaffoldMultiReadContract = <
  TAbi extends Abi,
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNamesScaffold<
    ContractAbi<TContractName>,
    "view"
  >,
>({
  calls,
  ...restConfig
}: UseScaffoldMultiReadProps<TAbi, TContractName, TFunctionName>) => {
  const { targetNetwork } = useTargetNetwork();

  const { addresses, fnSelectors, rawArgs, callDataHelpers } = useMemo(() => {
    const parsedCalls = (calls ?? []).map((call) => {
      const { functionName, contractName, args } = call;

      // TODO: handle error if contract is not found
      const contract = contracts?.[targetNetwork.network]?.[
        contractName as ContractName
      ] as Contract<TContractName>;
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

    return {
      addresses,
      fnSelectors,
      rawArgs,
      callDataHelpers,
    };
  }, [calls, targetNetwork]);

  const useReadContractResult = useScaffoldReadContract({
    ...restConfig,
    contractName: "Multicall",
    functionName: "call_contracts",
    args: [addresses, fnSelectors, rawArgs],
  });

  const parsedData = useMemo(() => {
    // TODO: find the way to remove as bigint[][]
    const typedData = useReadContractResult.data as bigint[][] | undefined;

    if (!typedData) return typedData;

    return typedData.map((raw, index) => {
      const { functionName, contractName } = calls[index];
      const callDataHelper = callDataHelpers[index];
      const parsedData = callDataHelper.parse(
        functionName,
        raw.map((b) => b.toString()),
      );

      return parsedData;
    });
  }, [useReadContractResult.data]);

  return { ...useReadContractResult, parsedData: parsedData };
};
