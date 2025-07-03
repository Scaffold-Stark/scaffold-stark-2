import { Abi, useReadContract } from "@starknet-react/core";
import { BlockNumber, hash } from "starknet";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import {
    AbiFunctionOutputs,
    ContractAbi,
    ContractName,
    ExtractAbiFunctionNamesScaffold,
    UseScaffoldReadConfig,
} from "~~/utils/scaffold-stark/contract";
import { parseParamWithType } from "~~/utils/scaffold-stark/contract";

export type UseScaffoldMultiReadConfig<
    TAbi extends Abi,
    TContractName extends ContractName,
    TFunctionName extends ExtractAbiFunctionNamesScaffold<
        ContractAbi<TContractName>,
        "view"
    >,
> = UseScaffoldReadConfig<TAbi, TContractName, TFunctionName>;

export const useScaffoldMultiReadContract = <
    TAbi extends Abi,
    TContractName extends ContractName,
    TFunctionName extends ExtractAbiFunctionNamesScaffold<
        ContractAbi<TContractName>,
        "view"
    >,
>({
    calls,
    ...readConfig
}: {
    calls: Array<
        UseScaffoldMultiReadConfig<TAbi, TContractName, TFunctionName>
    >;
} & Omit<
    Parameters<typeof useReadContract>[0],
    "functionName" | "address" | "abi" | "args"
>) => {
    // Get the Multicall contract info
    const { data: multicallContract } = useDeployedContractInfo(
        "Multicall" as ContractName
    );

    // Get all the contracts that need to be called
    const contractInfos = calls.map((call) =>
        useDeployedContractInfo(call.contractName)
    );

    // Prepare the multicall data
    const contracts: string[] = [];
    const entryPointSelectors: string[] = [];
    const calldata: string[][] = [];

    let allContractsReady =
        multicallContract && contractInfos.every((info) => info.data);

    if (allContractsReady) {
        calls.forEach((call, index) => {
            const contractInfo = contractInfos[index];
            if (contractInfo.data) {
                contracts.push(contractInfo.data.address);

                // Find the function in the ABI to get the entry point selector
                const functionAbi = contractInfo.data.abi.find(
                    (item: any) =>
                        item.type === "function" &&
                        item.name === call.functionName
                ) as any;

                if (functionAbi) {
                    // Calculate entry point selector using the hash function
                    const entryPointSelector = hash.getSelectorFromName(
                        call.functionName
                    );
                    entryPointSelectors.push(entryPointSelector);

                    // Encode calldata for the function call
                    const encodedArgs =
                        (call.args as any[])?.map(
                            (arg: any, argIndex: number) => {
                                const input = functionAbi.inputs[argIndex];
                                return parseParamWithType(
                                    input.type,
                                    arg,
                                    true,
                                    true
                                );
                            }
                        ) || [];

                    calldata.push(encodedArgs);
                }
            }
        });
    }

    // Call the multicall contract
    const multicallResult = useReadContract({
        functionName: "call_contracts",
        address: multicallContract?.address,
        abi: multicallContract?.abi,
        watch: true,
        args: [contracts, entryPointSelectors, calldata],
        enabled: allContractsReady && contracts.length > 0,
        blockIdentifier: "pending" as BlockNumber,
        ...readConfig,
    });

    // Parse the results based on the individual function ABIs
    const parsedResults = multicallResult.data?.map(
        (rawResult: any, index: number) => {
            const call = calls[index];
            const contractInfo = contractInfos[index];

            if (contractInfo.data) {
                const functionAbi = contractInfo.data.abi.find(
                    (item: any) =>
                        item.type === "function" &&
                        item.name === call.functionName
                ) as any;

                if (
                    functionAbi &&
                    functionAbi.outputs &&
                    functionAbi.outputs.length > 0
                ) {
                    // Parse the result based on the output type
                    const outputType = functionAbi.outputs[0].type;
                    return parseParamWithType(
                        outputType,
                        rawResult,
                        true,
                        false
                    );
                }
            }

            return rawResult;
        }
    );

    return {
        ...multicallResult,
        data: parsedResults as Array<
            AbiFunctionOutputs<ContractAbi, TFunctionName> | undefined
        >,
    };
};

export function createMultiReadCall<
    TAbi extends Abi,
    TContractName extends ContractName,
    TFunctionName extends ExtractAbiFunctionNamesScaffold<
        ContractAbi<TContractName>,
        "view"
    >,
>(
    contractName: TContractName,
    functionName: TFunctionName,
    args: UseScaffoldMultiReadConfig<TAbi, TContractName, TFunctionName>["args"]
) {
    return { contractName, functionName, args };
}
