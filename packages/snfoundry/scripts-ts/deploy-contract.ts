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
  DeclareContractPayload
} from "starknet";
import { Network } from "./types";

const argv = yargs(process.argv.slice(2)).argv;
const networkName: string = argv["network"];

let deployments = {};
let deployCalls = [];

const { provider, deployer }: Network = networks[networkName];

const declareIfNot_NotWait = async (payload: DeclareContractPayload, options?: { maxFee?: bigint}) => {
  const declareContractPayload = extractContractHashes(payload);
  try {
    await provider.getClassByHash(declareContractPayload.classHash);
  } catch (error) {
    try {
      const declareOptions = options?.maxFee ? { maxFee: options.maxFee } : {};
      const { transaction_hash } = await deployer.declare(payload, declareOptions);
      if (networkName === "sepolia" || networkName === "mainnet") {
        await provider.waitForTransaction(transaction_hash);
      }
    } catch (e) {
      console.error("Error declaring contract:", e);
      throw e;
    }
  }
  return {
    classHash: declareContractPayload.classHash,
  };
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
    console.error("Error building UDC call:", error);
    throw error;
  }
};

const deployContract = async (
  contractName: string,
  exportContractName?: string,
  constructorArgs?: RawArgs,
  options?: {
    maxFee?: bigint;
  }
): Promise<{
  classHash: string;
  address: string;
}> => {
  try {
    await deployer.getContractVersion(deployer.address);
  } catch (e) {
    if (e.toString().includes("Contract not found")) {
      const errorMessage = `The wallet you're using to deploy the contract is not deployed in the ${networkName} network.`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    } else {
      console.error("Error getting contract version:", e);
      throw e;
    }
  }

  let compiledContractCasm;
  let compiledContractSierra;

  try {
    compiledContractCasm = JSON.parse(
      fs
        .readFileSync(
          path.resolve(
            __dirname,
            `../contracts/target/dev/contracts_${contractName}.compiled_contract_class.json`
          )
        )
        .toString("ascii")
    );
  } catch (error) {
    if (
      typeof error.message === "string" &&
      error.message.includes("no such file") &&
      error.message.includes("compiled_contract_class")
    ) {
      const match = error.message.match(
        /\/dev\/(.+?)\.compiled_contract_class/
      );
      const missingContractName = match ? match[1].split("_").pop() : "Unknown";
      console.error(
        `The contract "${missingContractName}" doesn't exist or is not compiled`
      );
    } else {
      console.error("Error reading compiled contract class file:", error);
    }
    return {
      classHash: "",
      address: "",
    };
  }

  try {
    compiledContractSierra = JSON.parse(
      fs
        .readFileSync(
          path.resolve(
            __dirname,
            `../contracts/target/dev/contracts_${contractName}.contract_class.json`
          )
        )
        .toString("ascii")
    );
  } catch (error) {
    console.error("Error reading contract class file:", error);
    return {
      classHash: "",
      address: "",
    };
  }

  const contractCalldata = new CallData(compiledContractSierra.abi);
  const constructorCalldata = constructorArgs
    ? contractCalldata.compile("constructor", constructorArgs)
    : [];
  console.log("Deploying Contract ", contractName);

  let { classHash } = await declareIfNot_NotWait({
    contract: compiledContractSierra,
    casm: compiledContractCasm,
  }, options);

  let randomSalt = stark.randomAddress();

  let { contractAddress } = await deployContract_NotWait({
    salt: randomSalt,
    classHash,
    constructorCalldata,
  });

  console.log("Contract Deployed at ", contractAddress);

  let finalContractName = exportContractName || contractName;

  deployments[finalContractName] = {
    classHash: classHash,
    address: contractAddress,
    contract: contractName,
  };

  return {
    classHash: classHash,
    address: contractAddress,
  };
};

const executeDeployCalls = async () => {
  try {
    let { transaction_hash } = await deployer.execute(deployCalls);
    console.log("Deploy Calls Executed at ", transaction_hash);
    if (networkName === "sepolia" || networkName === "mainnet") {
      await provider.waitForTransaction(transaction_hash);
    }
  } catch (error) {
    console.error("Error executing deploy calls:", error);
    // split the calls in half and try again recursively
    if (deployCalls.length > 1) {
      let half = Math.ceil(deployCalls.length / 2);
      let firstHalf = deployCalls.slice(0, half);
      let secondHalf = deployCalls.slice(half);
      deployCalls = firstHalf;
      await executeDeployCalls();
      deployCalls = secondHalf;
      await executeDeployCalls();
    }
  }
};

const exportDeployments = () => {
  const networkPath = path.resolve(
    __dirname,
    `../deployments/${networkName}_latest.json`
  );

  if (fs.existsSync(networkPath)) {
    const currentTimestamp = new Date().getTime();
    fs.renameSync(
      networkPath,
      networkPath.replace("_latest.json", `_${currentTimestamp}.json`)
    );
  }

  fs.writeFileSync(networkPath, JSON.stringify(deployments, null, 2));
};

export {
  deployContract,
  provider,
  deployer,
  exportDeployments,
  executeDeployCalls,
};
