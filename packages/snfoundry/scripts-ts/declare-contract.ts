import yargs from "yargs";
import fs from "fs";
import { green, red, yellow } from "./helpers/colorize-log";
import path from "path";
import {
  extractContractHashes,
  DeclareContractPayload,
  UniversalDetails,
  isSierra,
} from "starknet";
import { Network } from "./types";
import { networks } from "./helpers/networks";
import { getTxVersion } from "./helpers/fees";

const argv = yargs(process.argv.slice(2))
  .option("network", {
    type: "string",
    description: "Specify the network",
    demandOption: true,
  })
  .option("fee", {
    type: "string",
    description: "Specify the fee token",
    choices: ["eth", "strk"],
    default: "eth",
  })
  .parseSync();

const networkName: string = argv.network;
const feeToken: string = argv.fee as string;
const { provider, deployer }: Network = networks[networkName];
const declareIfNot_NotWait = async (
  payload: DeclareContractPayload,
  options?: UniversalDetails
) => {
  const declareContractPayload = extractContractHashes(payload);
  try {
    await provider.getClassByHash(declareContractPayload.classHash);
  } catch (error) {
    try {
      const isSierraContract = isSierra(payload.contract);
      const txVersion = await getTxVersion(
        networks[networkName],
        feeToken,
        isSierraContract
      );
      const { transaction_hash } = await deployer.declare(payload, {
        ...options,
        version: txVersion,
      });
      if (networkName === "sepolia" || networkName === "mainnet") {
        await provider.waitForTransaction(transaction_hash);
      }
    } catch (e) {
      console.error(red("Error declaring contract:"), e);
      throw e;
    }
  }
  return {
    classHash: declareContractPayload.classHash,
  };
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

const declareScript = async (): Promise<void> => {
  try {
    const contract = "YourContract";

    const compiledContractSierra = JSON.parse(
      fs
        .readFileSync(findContractFile(contract, "contract_class"))
        .toString("ascii")
    );

    const compiledContractCasm = JSON.parse(
      fs
        .readFileSync(findContractFile(contract, "compiled_contract_class"))
        .toString("ascii")
    );

    console.log(yellow("Declaring Contract..."));

    const { classHash } = await declareIfNot_NotWait({
      contract: compiledContractSierra,
      casm: compiledContractCasm,
    });

    console.log(green("Contract Declared Successfully"));
    console.log("Class Hash:", classHash);
  } catch (error) {
    console.error(red("Error declaring contract:"), error);
    process.exit(1);
  }
};

declareScript()
  .then(() => {
    console.log(green("Declaration Complete"));
    process.exit(0);
  })
  .catch(console.error);
