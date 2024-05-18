import fs from "fs";
import path from "path";
import { networks } from "./helpers/networks";
import yargs from "yargs";
import { CallData, hash } from "starknet-dev";
import { Network } from "./types";
import { LegacyContractClass, CompiledSierra, RawArgs } from "starknet";

let isFirstDeployment = true;

const resetDeploymentState = () => {
  isFirstDeployment = true;
};

const argv = yargs(process.argv.slice(2)).argv;
const networkName: string = argv["network"];

const { provider, deployer }: Network = networks[networkName];
const deployContract = async (
  constructorArgs: RawArgs,
  contractName: string,
  exportContractName?: string
): Promise<{ classHash: string; address: string }> => {
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

  let totalFee: bigint = 0n;

  let existingClassHash:
    | LegacyContractClass
    | Omit<CompiledSierra, "sierra_program_debug_info">;

  try {
    existingClassHash = await provider.getClassByHash(precomputedClassHash);
  } catch (e) {}

  try {
    if (!existingClassHash) {
      const { suggestedMaxFee: estimatedFeeDeclare } =
        await deployer.estimateDeclareFee(
          {
            contract: compiledContractSierra,
            casm: compiledContractCasm,
          },
          {}
        );
      totalFee += estimatedFeeDeclare * 2n;
    } else {
      const { suggestedMaxFee: estimatedFeeDeploy } =
        await deployer.estimateDeployFee({
          classHash: precomputedClassHash,
          constructorCalldata,
        });
      totalFee += estimatedFeeDeploy * 2n;
    }
  } catch (e) {
    console.error("Failed to estimate fee, setting up fee to 0.001 eth");
    totalFee = 500000000000000n;
  }

  try {
    const tryDeclareAndDeploy = await deployer.declareAndDeploy(
      {
        contract: compiledContractSierra,
        casm: compiledContractCasm,
        constructorCalldata,
      },
      {
        maxFee: totalFee * 20n, // this optional max fee serves when error AccountValidation Failed or small fee on public networks , try 5n , 10n, 20n, 50n, 100n
      }
    );
    contractAddress =
      "0x" + tryDeclareAndDeploy.deploy.address.slice(2).padStart(64, "0");
  } catch (e) {
    console.log("Error", e);
  }
  console.log("Deployed contract ", contractName, " at: ", contractAddress);
  const networkPath = path.resolve(
    __dirname,
    `../deployments/${networkName}_latest.json`
  );
  let deployments = {};

  if (isFirstDeployment) {
    if (fs.existsSync(networkPath)) {
      const currentTimestamp = new Date().getTime();
      const backupPath = networkPath.replace(
        "_latest.json",
        `_${currentTimestamp}.json`
      );
      fs.renameSync(networkPath, backupPath);

      // Load existing deployments
      const existingDeployments = JSON.parse(
        fs.readFileSync(backupPath).toString()
      );
      deployments = { ...existingDeployments };
    }
    isFirstDeployment = false;
  } else {
    if (fs.existsSync(networkPath)) {
      const existingDeployments = JSON.parse(
        fs.readFileSync(networkPath).toString()
      );
      deployments = { ...existingDeployments };
    }
  }

  let finalContractName = exportContractName || contractName;

  deployments[finalContractName] = {
    classHash: precomputedClassHash,
    address: contractAddress,
    contract: contractName,
  };

  fs.writeFileSync(networkPath, JSON.stringify(deployments, null, 2));
  return {
    classHash: precomputedClassHash,
    address: contractAddress,
  };
};

export { deployContract, provider, deployer, resetDeploymentState };
