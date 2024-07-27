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

const { provider, deployer }: Network = networks[networkName];

const declareIfNot_NotWait = async (payload: any) => {
  const declareContractPayload = extractContractHashes(payload);
  try {
    await provider.getClassByHash(declareContractPayload.classHash);
  } catch (error) {
    let { transaction_hash } = await deployer.declare(payload, {
      blockIdentifier: "pending" as BlockIdentifier,
    });
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
  let { transaction_hash } = await deployer.deploy(payload, {
    blockIdentifier: "pending" as BlockIdentifier,
  });

  let contractAddress = hash.calculateContractAddressFromHash(
    ec.starkCurve.pedersen(deployer.address, payload.salt),
    payload.classHash,
    payload.constructorCalldata,
    constants.UDC.ADDRESS
  );
  contractAddress = validateAndParseAddress(contractAddress);

  if (networkName == "sepolia" || networkName == "mainnet") {
    await provider.waitForTransaction(transaction_hash);
  }

  return {
    contractAddress,
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
  const compiledContractCasm = JSON.parse(
    fs
      .readFileSync(
        path.resolve(
          __dirname,
          `../contracts/target/dev/contracts_${contractName}.compiled_contract_class.json`
        )
      )
      .toString("ascii")
  );

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

export { deployContract, provider, deployer, exportDeployments };
