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
} from "starknet";
import { DeployContractParams, Network } from "./types";
import { green, red, yellow } from "./helpers/colorize-log";

interface Arguments {
  network: string;
  reset: boolean;
  [x: string]: unknown;
  _: (string | number)[];
  $0: string;
}

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

const { provider, deployer }: Network = networks[networkName];

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
    const { transaction_hash } = await deployer.declare(payload, {
      ...options,
      version: constants.TRANSACTION_VERSION.V3,
    });

    if (networkName === "sepolia" || networkName === "mainnet") {
      console.log(
        yellow("Waiting for declaration transaction to be accepted...")
      );
      const receipt = await provider.waitForTransaction(transaction_hash);
      console.log(
        yellow("Declaration transaction receipt:"),
        JSON.stringify(
          receipt,
          (_, v) => (typeof v === "bigint" ? v.toString() : v),
          2
        )
      );

      const receiptAny = receipt as any;
      if (receiptAny.execution_status !== "SUCCEEDED") {
        const revertReason = receiptAny.revert_reason || "Unknown reason";
        throw new Error(
          red(`Declaration failed or reverted. Reason: ${revertReason}`)
        );
      }
      console.log(green("Declaration successful"));
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
      console.error(
        red("Class declaration failed: deployer"),
        deployer.address,
        red("has insufficient balance.")
      );
      throw "Class declaration failed: insufficient balance";
    }

    console.error(red("Class declaration failed: error details below"));
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
    const { calls, addresses } = transaction.buildUDCCall(
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
    let { transaction_hash } = await deployer.execute(deployCalls, {
      ...options,
      version: constants.TRANSACTION_VERSION.V3,
    });
    if (networkName === "sepolia" || networkName === "mainnet") {
      const receipt = await provider.waitForTransaction(transaction_hash);
      const receiptAny = receipt as any;
      if (receiptAny.execution_status !== "SUCCEEDED") {
        const revertReason = receiptAny.revert_reason;
        throw new Error(red(`Deploy Calls Failed: ${revertReason}`));
      }
    }
    console.log(green("Deploy Calls Executed at "), transaction_hash);
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
        red("Deployment tx execution failed: deployer"),
        deployer.address,
        red("has insufficient balance.")
      );
      throw "Deployment tx execution failed: insufficient balance";
    }

    console.error(red("Deployment tx execution failed: error details below"));
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
    const errorMessage = `Deployer account is not defined. \`ACCOUNT_ADDRESS_${networkName.toUpperCase()}\` or \`PRIVATE_KEY_${networkName.toUpperCase()}\` is missing from \`.env\`.`;
    console.error(red(errorMessage));
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
      const errorMessage = `Deployer account at \`${deployer.address}\` hasn't been deployed on ${networkName} network.`;
      console.error(red(errorMessage), e);
      throw new Error(errorMessage);
    }

    const errorMessage =
      "Unable to verify signature from the deployer account. Possible causes: network latency, RPC timeout.";
    console.error(red(errorMessage), e);
    throw new Error(errorMessage);
  }

  if (!isValidSig) {
    const errorMessage = `Invalid signature. \`ACCOUNT_ADDRESS_${networkName.toUpperCase()}\` is not match with \`PRIVATE_KEY_${networkName.toUpperCase()}\`.`;
    console.error(red(errorMessage));
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
};
