import fs from "fs";
import path from "path";
import { networks } from "./helpers/networks";
import yargs from "yargs";
import { CallData, hash } from "starknet-dev";
import { Network } from "./types";
import { LegacyContractClass, CompiledSierra, RawArgs, getChecksumAddress } from "starknet";

const argv = yargs(process.argv.slice(2)).argv;
const networkName: string = argv["network"];

let deployments = {};

const { provider, deployer }: Network = networks[networkName];

const checkWalletDeployed = async (walletAddress: string): Promise<boolean> => {
  try {
    const accountInfo = getChecksumAddress(walletAddress);
    return accountInfo !== null;
  } catch (error) {
    console.error("Error checking wallet status:", error);
    return false;
  }
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

  totalFee = options?.maxFee || totalFee * 20n; // this optional max fee serves when error AccountValidation Failed or small fee on public networks , try 5n , 10n, 20n, 50n, 100n

  try {
    const tryDeclareAndDeploy = await deployer.declareAndDeploy(
      {
        contract: compiledContractSierra,
        casm: compiledContractCasm,
        constructorCalldata,
      },
      {
        maxFee: totalFee,
      }
    );
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

const deployScript = async (): Promise<void> => {
  const walletAddress = deployer.address;
  const isWalletDeployed = await checkWalletDeployed(walletAddress);

  if (!isWalletDeployed) {
    console.error(
      "StarkNet wallet is not deployed. Please initialize and deploy your wallet before proceeding."
    );
    console.log("To deploy your wallet, follow these steps:");
    console.log("1. Initialize your StarkNet wallet.");
    console.log("2. Deploy the initialized wallet.");
    console.log("3. Retry the contract deployment.");
    return;
  }

  try {
    await deployContract(
      {
        owner: walletAddress, // the deployer address is the owner of the contract
      },
      "YourContract"
    );
    exportDeployments();
    console.log("Contract deployment successful. All setup done.");
  } catch (error) {
    console.error("Contract deployment failed:", error);
  }
};

deployScript().catch(console.error);

export { deployContract, provider, deployer, exportDeployments };
  function contractAddress(walletAddress: string) {
    throw new Error("Function not implemented.");
  }

