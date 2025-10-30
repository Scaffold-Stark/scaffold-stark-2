import fs from "fs";
import path from "path";
import { networks } from "./helpers/networks";
import yargs from "yargs";
import {
  CallData,
  stark,
  RawArgs,
  transaction,
  extractContractHashes,
  DeclareContractPayload,
  UniversalDetails,
  constants,
  TypedData,
  RpcError,
  ETransactionVersion,
  defaultDeployer,
} from "starknet";
import { DeployContractParams, Network } from "./types";
import { green, red, yellow } from "./helpers/colorize-log";
import {
  logDeploymentSummary,
  postDeploymentBalanceSummary,
} from "./helpers/log";

interface Arguments {
  network: string;
  reset: boolean;
  [x: string]: unknown;
  _: (string | number)[];
  $0: string;
}

const validateConstructorArgsWithStarknetJS = (
  abi: any[],
  constructorArgs: any
): { isValid: boolean; error?: string } => {
  try {
    const constructorAbi = abi.find((item: any) => item.type === "constructor");
    if (constructorAbi) {
      const requiredArgs = constructorAbi.inputs || [];
      for (const arg of requiredArgs) {
        if (
          arg.type === "core::starknet::contract_address::ContractAddress" &&
          constructorArgs[arg.name]
        ) {
          const addressValue = constructorArgs[arg.name];
          try {
            const addressBigInt = BigInt(addressValue);
            if (addressBigInt === BigInt(0)) {
              return {
                isValid: false,
                error: `Invalid ContractAddress for '${arg.name}': Zero address (${addressValue}) is not allowed. Please provide a valid non-zero address.`,
              };
            }
          } catch (parseError) {}
        }
      }
    }

    const contractCalldata = new CallData(abi);
    contractCalldata.compile("constructor", constructorArgs);
    return { isValid: true };
  } catch (error: any) {
    const originalError = error.message || "Invalid constructor arguments";
    let userFriendlyMessage = originalError;

    if (originalError.includes("felt") || originalError.includes("Felt")) {
      userFriendlyMessage =
        "Invalid felt252 value. Expected: hex string (0x123...), decimal string ('123'), or number.";
    } else if (
      originalError.includes("address") ||
      originalError.includes("Address")
    ) {
      userFriendlyMessage =
        "Invalid ContractAddress. Expected: valid hex address (0x123...abc).";
    } else if (
      originalError.includes("uint256") ||
      originalError.includes("u256")
    ) {
      userFriendlyMessage =
        "Invalid u256 value. Expected: number, bigint, hex string, or {low: '123', high: '0'} object.";
    } else if (
      originalError.includes("bool") ||
      originalError.includes("Bool")
    ) {
      userFriendlyMessage =
        "Invalid boolean value. Expected: true, false, 0, or 1.";
    } else if (
      originalError.includes("ByteArray") ||
      originalError.includes("string")
    ) {
      userFriendlyMessage = "Invalid ByteArray value. Expected: string.";
    } else if (
      originalError.includes("Array") ||
      originalError.includes("array")
    ) {
      userFriendlyMessage =
        "Invalid array value. Expected: array format [item1, item2, ...].";
    } else if (
      originalError.includes("missing") ||
      originalError.includes("expected")
    ) {
      userFriendlyMessage = originalError;
    }

    return {
      isValid: false,
      error: `${userFriendlyMessage}${
        originalError !== userFriendlyMessage
          ? ` (Details: ${originalError})`
          : ""
      }`,
    };
  }
};

const argv = yargs(process.argv.slice(2))
  .option("network", {
    type: "string",
    description: "Specify the network",
    demandOption: true,
  })
  .option("reset", {
    type: "boolean",
    description: "Reset deployments (remove existing deployments)",
    default: true,
  })
  .parseSync() as Arguments;

const networkName: string = argv.network;
const resetDeployments: boolean = argv.reset;

let deployments = {};
let deployCalls = [];

const { provider, deployer, feeToken }: Network = networks[networkName];

const estimateTip = async (): Promise<bigint> => {
  return networkName === "devnet"
    ? 1000n
    : (await deployer.getEstimateTip()).recommendedTip;
};

/**
 * Calculate estimated tip for declaration transaction with fee escalation
 */
const estimateDeclareFee = async (
  payload: DeclareContractPayload,
  classHash: string
): Promise<bigint> => {
  const tip = await estimateTip();
  const { overall_fee } = await deployer.estimateDeclareFee(
    {
      contract: payload.contract,
      compiledClassHash: classHash,
    },
    { tip }
  );

  const minimumTip = 500000000000000000n; // 0.1 STRK
  const finalTip = overall_fee > minimumTip ? overall_fee : minimumTip;

  return finalTip;
};

/**
 * Get contract size for logging purposes
 */
const getContractSize = (payload: DeclareContractPayload): number => {
  return typeof payload.contract === "string"
    ? payload.contract.length
    : JSON.stringify(payload.contract).length;
};

/**
 * Calculate retry interval based on contract size
 */
const estimateRetryInterval = (payload: DeclareContractPayload): number => {
  const contractSize = getContractSize(payload);

  const baseInterval = 5000;
  const sizeMultiplier = Math.ceil(contractSize / 100000) * 1.5; // 1.5 seconds per 100KB

  return Math.min(baseInterval + sizeMultiplier * 1000, 30000);
};

const declareIfNot_NotWait = async (
  payload: DeclareContractPayload,
  options?: UniversalDetails
) => {
  const { classHash } = extractContractHashes(payload);

  try {
    await provider.getClassByHash(classHash);
    console.log(
      green("Skipping declare - class hash"),
      classHash,
      green("already exists on-chain.")
    );

    return {
      classHash,
    };
  } catch (e) {
    if (e instanceof RpcError && e.isType("CLASS_HASH_NOT_FOUND")) {
      console.log(
        yellow("Class hash"),
        classHash,
        yellow("not found, proceeding with declaration...")
      );
    } else {
      console.error(red("Error while checking classHash"), classHash);
      throw e;
    }
  }

  try {
    const estimatedDeclareFee = await estimateDeclareFee(payload, classHash);
    const estimatedTip = await estimateTip();
    const retryInterval = estimateRetryInterval(payload);
    console.log(
      yellow(`Estimated declare fee: ${estimatedDeclareFee.toString()}`)
    );
    console.log(yellow(`Estimated tip: ${estimatedTip.toString()}`));
    console.log(
      yellow(`Estimated retry interval: ${retryInterval.toString()}`)
    );

    const declareOptions = {
      ...options,
      tip: estimatedTip,
      estimated_tip: estimatedDeclareFee,
    };

    const { transaction_hash } = await deployer.declare(
      payload,
      declareOptions
    );

    if (networkName === "sepolia" || networkName === "mainnet") {
      console.log(
        yellow("Waiting for declaration transaction to be accepted...")
      );
      const receipt = await provider.waitForTransaction(transaction_hash, {
        retryInterval,
      });

      const receiptAny = receipt as any;
      if (receiptAny.execution_status !== "SUCCEEDED") {
        // Show verbose error details when declaration fails
        console.log(
          red("Declaration transaction receipt:"),
          JSON.stringify(
            receipt,
            (_, v) => (typeof v === "bigint" ? v.toString() : v),
            2
          )
        );
        const revertReason = receiptAny.revert_reason || "Unknown reason";
        throw new Error(
          red(`Declaration failed or reverted. Reason: ${revertReason}`)
        );
      }
      console.log(green("Declaration successful"));
      console.log(yellow("Declaration fee:"), receiptAny.actual_fee);
    }

    return {
      classHash: classHash,
    };
  } catch (e) {
    if (
      e instanceof RpcError &&
      e.isType("VALIDATION_FAILURE") &&
      e.baseError.data.includes("exceed balance")
    ) {
      console.error(red("❌ Class declaration failed: Insufficient balance"));
      console.error(red(`   Deployer address: ${deployer.address}`));
      console.error(
        red(
          `   Please ensure your account has enough ${feeToken[0].name} to cover the declaration fee.`
        )
      );
      throw "Class declaration failed: insufficient balance";
    }

    if (
      e instanceof RpcError &&
      (e.message?.includes("connection") || e.message?.includes("network"))
    ) {
      console.error(red("❌ Class declaration failed: RPC connection error"));
      console.error(red(`   Unable to connect to ${networkName} network.`));
      console.error(
        red("   Please check your RPC URL and network connectivity.")
      );
      throw "Class declaration failed: RPC connection error";
    }

    if (
      e instanceof RpcError &&
      (e.message?.includes("timeout") || e.message?.includes("TIMEOUT"))
    ) {
      console.error(red("❌ Class declaration failed: Request timeout"));
      console.error(
        red(
          "   The RPC request timed out. Please try again or check your network connection."
        )
      );
      throw "Class declaration failed: request timeout";
    }

    console.error(red("❌ Class declaration failed: error details below"));
    console.error(e);
    throw "Class declaration failed";
  }
};

const deployContract_NotWait = async (payload: {
  salt: string;
  classHash: string;
  constructorCalldata: RawArgs;
}) => {
  try {
    const { calls, addresses } = defaultDeployer.buildDeployerCall(
      payload,
      deployer.address
    );
    deployCalls.push(...calls);
    return {
      contractAddress: addresses[0],
    };
  } catch (error) {
    console.error(red("Error building UDC call:"), error);
    throw error;
  }
};

const findContractFile = (
  contract: string,
  fileType: "compiled_contract_class" | "contract_class"
): string => {
  const targetDir = path.resolve(__dirname, "../contracts/target/dev");
  const files = fs.readdirSync(targetDir);

  const pattern = new RegExp(`.*${contract}\\.${fileType}\\.json$`);
  const matchingFile = files.find((file) => pattern.test(file));

  if (!matchingFile) {
    throw new Error(
      `Could not find ${fileType} file for contract "${contract}". ` +
        `Try removing snfoundry/contracts/target, then run 'yarn compile' and check if your contract name is correct inside the contracts/target/dev directory.`
    );
  }

  return path.join(targetDir, matchingFile);
};

/**
 * Deploy a contract using the specified parameters.
 *
 * @param {DeployContractParams} params - The parameters for deploying the contract.
 * @param {string} params.contract - The name of the contract to deploy.
 * @param {string} [params.contractName] - The name to export the contract as (optional).
 * @param {RawArgs} [params.constructorArgs] - The constructor arguments for the contract (optional).
 * @param {UniversalDetails} [params.options] - Additional deployment options (optional).
 *
 * @returns {Promise<{ classHash: string; address: string }>} The deployed contract's class hash and address.
 *
 * @example
 * ///Example usage of deployContract function
 * await deployContract({
 *   contract: "YourContract",
 *   contractName: "YourContractExportName",
 *   constructorArgs: { owner: deployer.address },
 *   options: { maxFee: BigInt(1000000000000) }
 * });
 */

const deployContract = async (
  params: DeployContractParams
): Promise<{
  classHash: string;
  address: string;
}> => {
  const { contract, constructorArgs, contractName, options } = params;
  let compiledContractCasm;
  let compiledContractSierra;

  try {
    compiledContractCasm = JSON.parse(
      fs
        .readFileSync(findContractFile(contract, "compiled_contract_class"))
        .toString("ascii")
    );
  } catch (error) {
    if (error.message.includes("Could not find")) {
      console.error(
        red(`The contract "${contract}" doesn't exist or is not compiled`)
      );
    } else {
      console.error(red("Error reading compiled contract class file: "), error);
    }
    return {
      classHash: "",
      address: "",
    };
  }

  try {
    compiledContractSierra = JSON.parse(
      fs
        .readFileSync(findContractFile(contract, "contract_class"))
        .toString("ascii")
    );
  } catch (error) {
    console.error(red("Error reading contract class file: "), error);
    return {
      classHash: "",
      address: "",
    };
  }

  const abi = compiledContractSierra.abi;
  const constructorAbi = abi.find((item: any) => item.type === "constructor");
  if (constructorAbi) {
    const requiredArgs = constructorAbi.inputs || [];
    if (!constructorArgs) {
      throw new Error(
        red(
          `Missing constructor arguments: expected ${
            requiredArgs.length
          } (${requiredArgs
            .map((a: any) => `${a.name}: ${a.type}`)
            .join(", ")}), but got none.`
        )
      );
    }

    for (const arg of requiredArgs) {
      if (
        !(arg.name in constructorArgs) ||
        constructorArgs[arg.name] === undefined ||
        constructorArgs[arg.name] === null ||
        constructorArgs[arg.name] === ""
      ) {
        throw new Error(
          red(
            `Missing value for constructor argument '${arg.name}' of type '${arg.type}'.`
          )
        );
      }
    }

    const validationResult = validateConstructorArgsWithStarknetJS(
      abi,
      constructorArgs
    );
    if (!validationResult.isValid) {
      throw new Error(
        red(`Constructor validation failed: ${validationResult.error}`)
      );
    }
  }

  const contractCalldata = new CallData(compiledContractSierra.abi);
  const constructorCalldata = constructorArgs
    ? contractCalldata.compile("constructor", constructorArgs)
    : [];

  console.log(yellow("Deploying Contract "), contractName || contract);

  let { classHash } = await declareIfNot_NotWait(
    {
      contract: compiledContractSierra,
      casm: compiledContractCasm,
    },
    options
  );

  let randomSalt = stark.randomAddress();

  let { contractAddress } = await deployContract_NotWait({
    salt: randomSalt,
    classHash,
    constructorCalldata,
  });

  console.log(green("Contract Deployed at "), contractAddress);

  let finalContractName = contractName || contract;

  deployments[finalContractName] = {
    classHash: classHash,
    address: contractAddress,
    contract: contract,
  };

  return {
    classHash: classHash,
    address: contractAddress,
  };
};

const executeDeployCalls = async (options?: UniversalDetails) => {
  if (deployCalls.length < 1) {
    throw new Error(
      red(
        "Aborted: No contract to deploy. Please prepare the contracts with `deployContract`"
      )
    );
  }

  try {
    const executeOptions =
      networkName === "devnet" ? { ...options, tip: 1000n } : { ...options };
    let { transaction_hash } = await deployer.execute(
      deployCalls,
      executeOptions
    );
    console.log(green("Deploy Calls Executed at "), transaction_hash);
    if (networkName === "sepolia" || networkName === "mainnet") {
      const receipt = await provider.waitForTransaction(transaction_hash);
      const receiptAny = receipt as any;
      if (receiptAny.execution_status !== "SUCCEEDED") {
        const revertReason = receiptAny.revert_reason;
        throw new Error(red(`Deploy Calls Failed: ${revertReason}`));
      }
      // logging links beautifully.
      logDeploymentSummary({
        network: networkName,
        transactionHash: transaction_hash,
        deployments,
      });
      // check recipient and if unit of feeToken is FRI its stark if WEI its ether
      await postDeploymentBalanceSummary({
        provider,
        deployer,
        reciept: receiptAny,
        feeToken: feeToken,
      });
    }
  } catch (e) {
    // split the calls in half and try again recursively
    if (deployCalls.length > 100) {
      let half = Math.ceil(deployCalls.length / 2);
      let firstHalf = deployCalls.slice(0, half);
      let secondHalf = deployCalls.slice(half);
      deployCalls = firstHalf;
      await executeDeployCalls(options);
      deployCalls = secondHalf;
      await executeDeployCalls(options);

      return;
    }

    if (
      e instanceof RpcError &&
      e.isType("VALIDATION_FAILURE") &&
      e.baseError.data.includes("exceed balance")
    ) {
      console.error(
        red("❌ Deployment execution failed: Insufficient balance")
      );
      console.error(red(`   Deployer address: ${deployer.address}`));
      console.error(
        red(
          `   Please ensure your account has enough ${feeToken[0].name} to cover the deployment fees.`
        )
      );
      throw "Deployment tx execution failed: insufficient balance";
    }

    if (
      e instanceof RpcError &&
      (e.message?.includes("connection") || e.message?.includes("network"))
    ) {
      console.error(
        red("❌ Deployment execution failed: RPC connection error")
      );
      console.error(red(`   Unable to connect to ${networkName} network.`));
      console.error(
        red("   Please check your RPC URL and network connectivity.")
      );
      throw "Deployment tx execution failed: RPC connection error";
    }

    if (
      e instanceof RpcError &&
      (e.message?.includes("timeout") || e.message?.includes("TIMEOUT"))
    ) {
      console.error(red("❌ Deployment execution failed: Request timeout"));
      console.error(
        red(
          "   The RPC request timed out. Please try again or check your network connection."
        )
      );
      throw "Deployment tx execution failed: request timeout";
    }

    console.error(red("❌ Deployment execution failed: error details below"));
    console.error(e);
    throw "Deployment tx execution failed";
  }
};

const loadExistingDeployments = () => {
  const networkPath = path.resolve(
    __dirname,
    `../deployments/${networkName}_latest.json`
  );
  if (fs.existsSync(networkPath)) {
    return JSON.parse(fs.readFileSync(networkPath, "utf8"));
  }
  return {};
};

const exportDeployments = () => {
  const networkPath = path.resolve(
    __dirname,
    `../deployments/${networkName}_latest.json`
  );

  if (!resetDeployments && fs.existsSync(networkPath)) {
    const currentTimestamp = new Date().getTime();
    fs.renameSync(
      networkPath,
      networkPath.replace("_latest.json", `_${currentTimestamp}.json`)
    );
  }

  if (resetDeployments && fs.existsSync(networkPath)) {
    fs.unlinkSync(networkPath);
  }

  fs.writeFileSync(networkPath, JSON.stringify(deployments, null, 2));
};

const assertDeployerDefined = () => {
  if (!deployer) {
    const errorMessage = `❌ Deployer account is not defined. \`ACCOUNT_ADDRESS_${networkName.toUpperCase()}\` or \`PRIVATE_KEY_${networkName.toUpperCase()}\` is missing from \`.env\`.\n   Please add both environment variables to your \`.env\` file.`;
    throw new Error(errorMessage);
  }
};

const assertRpcNetworkActive = async () => {
  if (!provider) {
    const errorMessage = `❌ RPC provider is not defined. \`RPC_URL_${networkName.toUpperCase()}\` is missing from \`.env\`.`;
    throw new Error(errorMessage);
  }

  try {
    const block = await provider.getBlock("latest");
    console.log(green(`✓ RPC connected (Block #${block.block_number})`));
  } catch (e) {
    if (
      e instanceof RpcError &&
      (e.message?.includes("connection") || e.message?.includes("network"))
    ) {
      const errorMessage = `❌ RPC connection failed. Unable to connect to ${networkName} network.\n   Please check your \`RPC_URL_${networkName.toUpperCase()}\` in \`.env\` and ensure the RPC endpoint is accessible.`;
      throw new Error(errorMessage);
    }

    if (
      e instanceof RpcError &&
      (e.message?.includes("timeout") || e.message?.includes("TIMEOUT"))
    ) {
      const errorMessage = `❌ RPC request timeout. The connection to ${networkName} network timed out.\n   Please check your network connection and try again.`;
      throw new Error(errorMessage);
    }

    const errorMessage = `❌ RPC provider is not active. \`RPC_URL_${networkName.toUpperCase()}\` is not reachable.\n   Error details: ${
      e.message || e
    }`;
    throw new Error(errorMessage);
  }
};

const assertDeployerSignable = async () => {
  const typedData: TypedData = {
    types: {
      StarkNetDomain: [
        { name: "name", type: "felt" },
        { name: "version", type: "felt" },
      ],
      Message: [{ name: "content", type: "felt" }],
    },
    primaryType: "Message",
    domain: {
      name: "snfoundry",
      version: "1",
    },
    message: {
      content: "Hello, StarkNet!",
    },
  };
  let isValidSig = false;

  try {
    const signature = await deployer.signMessage(typedData);
    isValidSig = await deployer.verifyMessageInStarknet(
      typedData,
      signature,
      deployer.address
    );
  } catch (e) {
    if (e.toString().includes("Contract not found")) {
      const errorMessage = `❌ Deployer account at \`${deployer.address}\` hasn't been deployed on ${networkName} network.\n   Please deploy your account first or use a different account address.`;

      throw new Error(errorMessage);
    }

    if (
      e instanceof RpcError &&
      (e.message?.includes("connection") || e.message?.includes("network"))
    ) {
      const errorMessage = `❌ Unable to verify deployer signature: RPC connection error.\n   Please check your network connection and RPC endpoint.`;

      throw new Error(errorMessage);
    }

    if (
      e instanceof RpcError &&
      (e.message?.includes("timeout") || e.message?.includes("TIMEOUT"))
    ) {
      const errorMessage = `❌ Unable to verify deployer signature: Request timeout.\n   Please try again or check your network connection.`;

      throw new Error(errorMessage);
    }

    const errorMessage = `❌ Unable to verify signature from the deployer account.\n   Possible causes: network latency, RPC timeout, or invalid account configuration.`;

    throw new Error(errorMessage);
  }

  if (!isValidSig) {
    const errorMessage = `❌ Invalid signature. \`ACCOUNT_ADDRESS_${networkName.toUpperCase()}\` does not match \`PRIVATE_KEY_${networkName.toUpperCase()}\`.\n   Please verify that your account address and private key are correctly configured in \`.env\`.`;

    throw new Error(errorMessage);
  }
};

export {
  deployContract,
  provider,
  deployer,
  loadExistingDeployments,
  exportDeployments,
  executeDeployCalls,
  resetDeployments,
  assertDeployerDefined,
  assertDeployerSignable,
  assertRpcNetworkActive,
};
