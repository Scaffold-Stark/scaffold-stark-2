import * as fs from "fs";
import { execSync } from "child_process";
import * as crypto from "crypto";
import * as path from "path";
import dotenv from "dotenv";

dotenv.config();

const envFilePath = path.resolve(__dirname, "../../.env");

function loadEnvVariables(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    console.error(".env file not found.");
    process.exit(1);
  }

  const envConfig = dotenv.parse(fs.readFileSync(filePath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

function generateNameString(length: number): string {
  return crypto.randomBytes(length / 2).toString("hex");
}

function deploy(network: string = "devnet"): void {
  const deployerName = generateNameString(8);

  let command: string;
  if (network === "sepolia") {
    console.log("sepolia network specified. Running...");
    command = `
      cd scripts && rm -rf scripts_alpha-sepolia_state.json && cd .. && rm -rf target && scarb build && 
      sncast --url ${process.env.RPC_URL_SEPOLIA} account add --name "${deployerName}" --address ${process.env.ACCOUNT_ADDRESS_SEPOLIA} --private-key ${process.env.PRIVATE_KEY_SEPOLIA} --type oz --add-profile "${deployerName}" && 
      sncast --url ${process.env.RPC_URL_SEPOLIA} --account "${deployerName}" script run scripts --package scripts && 
      ts-node ./scripts-ts/helpers/parse-deployments.ts --network sepolia
    `;
  } else if (network === "devnet") {
    console.log(
      "No network specified. Running deployment on Devnet by default..."
    );
    command = `
      cd scripts && rm -rf  scripts_SN_GOERLI_state.json && cd .. && rm -rf target && scarb build && 
      sncast --url ${process.env.RPC_URL_DEVNET} account add --name "${deployerName}" --address ${process.env.ACCOUNT_ADDRESS_DEVNET} --private-key ${process.env.PRIVATE_KEY_DEVNET} --type oz --add-profile "${deployerName}" && 
      sncast --url ${process.env.RPC_URL_DEVNET} --account "${deployerName}" script run scripts --package scripts && 
      ts-node './scripts-ts/helpers/parse-deployments.ts'
    `;
  } else if (network === "mainnet") {
    console.log("mainnet specified. Running...");
    command = `
      cd scripts && rm -rf scripts_alpha-mainnet_state.json && cd .. && rm -rf target && scarb build && 
      sncast --url ${process.env.RPC_URL_MAINNET} account add --name "${deployerName}" --address ${process.env.ACCOUNT_ADDRESS_MAINNET} --private-key ${process.env.PRIVATE_KEY_MAINNET} --type oz --add-profile "${deployerName}" && 
      sncast --url ${process.env.RPC_URL_MAINNET} --account "${deployerName}" script run scripts --package scripts && 
      ts-node ./scripts-ts/helpers/parse-deployments.ts --network mainnet
    `;
  } else {
    console.error(
      "Invalid command for deployer. Use: yarn deploy or yarn deploy --network <sepolia>"
    );
    process.exit(1);
  }

  try {
    execSync(command, { stdio: "inherit" });
  } catch (error) {
    console.error(`Error executing command: ${error.message}`);
    process.exit(1);
  }
}

// Main script
const args = process.argv.slice(2);
let command: string | undefined;
let network: string | undefined;

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case "deploy":
      command = "deploy";
      break;
    case "--network":
      network = args[i + 1];
      i++;
      break;
    default:
      console.error("Invalid Command");
      process.exit(1);
  }
}

if (command === "deploy") {
  loadEnvVariables(envFilePath);
  deploy(network);
} else {
  console.error("Invalid Command");
}
