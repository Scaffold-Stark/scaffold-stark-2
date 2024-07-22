import fs from "fs";
import path from "path";
import { networks } from "./helpers/networks";
import yargs from "yargs";
import { CallData, hash } from "starknet";
import { Network } from "./types";
import { LegacyContractClass, CompiledSierra, RawArgs } from "starknet";

const argv = yargs(process.argv.slice(2)).argv;
const networkName: string = argv["network"];

let deployments = {};

const { provider, deployer }: Network = networks[networkName];
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

  let contractAddress: string;

  const precomputedClassHash = hash.computeSierraContractClassHash(
    compiledContractSierra
  );
  const contractCalldata = new CallData(compiledContractSierra.abi);
  const constructorCalldata = constructorArgs
    ? contractCalldata.compile("constructor", constructorArgs)
    : [];
  console.log("Deploying Contract ", contractName);

  // TODO use maxfee

  try {
    const tryDeclareAndDeploy = await deployer.declareAndDeploy({
      contract: compiledContractSierra,
      casm: compiledContractCasm,
      constructorCalldata,
    });
    if (!tryDeclareAndDeploy.deploy.contract_address) {
      throw new Error(
        "Failed to deploy contract, try setting up a manual fee on deployContract, set maxFee to 0.001 ETH in WEI and increase it if needed."
      );
    }
    contractAddress =
      "0x" + tryDeclareAndDeploy.deploy.address.slice(2).padStart(64, "0");
  } catch (e) {
    console.log("Error", e);
  }
  console.log("Deployed contract ", contractName, " at: ", contractAddress);

  let finalContractName = exportContractName || contractName;

  deployments[finalContractName] = {
    classHash: precomputedClassHash,
    address: contractAddress,
    contract: contractName,
  };

  return {
    classHash: precomputedClassHash,
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
