import fs from "fs";
import path from "path";
import { networks } from "./helpers/networks";
import yargs from "yargs";
import {
  BlockIdentifier,
  CallData,
  hash,
  stark,
  RawArgs,
  constants,
  ec,
  validateAndParseAddress,
  transaction,
} from "starknet";
import { Network } from "./types";
import {
  LegacyContractClass,
  CompiledSierra,
  extractContractHashes,
} from "starknet";

const argv = yargs(process.argv.slice(2)).argv;
const networkName: string = argv["network"];

let deployments = {};

let deployCalls = [];

const { provider, deployer }: Network = networks[networkName];

const declareIfNot_NotWait = async (payload: any) => {
  const declareContractPayload = extractContractHashes(payload);
  try {
    await provider.getClassByHash(declareContractPayload.classHash);
  } catch (error) {
    let { transaction_hash } = await deployer.declare(payload);
    if (networkName == "sepolia" || networkName == "mainnet") {
      await provider.waitForTransaction(transaction_hash);
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
  let { calls, addresses } = transaction.buildUDCCall(
    payload,
    deployer.address
  );
  deployCalls.push(...calls);
  return {
    contractAddress: addresses[0],
  };
};

const deployContract = async (
  constructorArgs: RawArgs,
  contractName: string,
  exportContractName?: string,
  options?: {
    maxFee: bigint;
  }
): Promise<{
  classHash: string;
  address: string;
}> => {
  try {
    await deployer.getContractVersion(deployer.address);
  } catch (e) {
    if (e.toString().includes("Contract not found")) {
      throw new Error(
        `The wallet you're using to deploy the contract is not deployed in ${networkName} network`
      );
    }
  }

  let compiledContractCasm;

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
      const contractName = match ? match[1].split("_").pop() : "Unknown";
      console.error(
        `The contract "${contractName}" doesn't exist or is not compiled`
      );
    } else {
      console.error(error);
    }
    return {
      classHash: "",
      address: "",
    };
  }

  const compiledContractSierra = JSON.parse(
    fs
      .readFileSync(
        path.resolve(
          __dirname,
          `../contracts/target/dev/contracts_${contractName}.contract_class.json`
        )
      )
      .toString("ascii")
  );

  const contractCalldata = new CallData(compiledContractSierra.abi);
  const constructorCalldata = constructorArgs
    ? contractCalldata.compile("constructor", constructorArgs)
    : [];
  console.log("Deploying Contract ", contractName);

  let { classHash } = await declareIfNot_NotWait({
    contract: compiledContractSierra,
    casm: compiledContractCasm,
  });

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
    if (networkName == "sepolia" || networkName == "mainnet") {
      await provider.waitForTransaction(transaction_hash);
    }
  } catch (error) {
    // split the calls in half and try again recursively
    if (deployCalls.length > 1) {
      let half = deployCalls.length / 2;
      let firstHalf = deployCalls.slice(0, half);
      let secondHalf = deployCalls.slice(half, deployCalls.length);
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
