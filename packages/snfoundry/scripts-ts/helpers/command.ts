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

function deploy(network: string = "devnet"): void {
  let command: string;
  if (network === "sepolia") {
    console.log("sepolia network specified. Running...");
    command = `
      sncast account import --url ${process.env.RPC_URL_SEPOLIA} --name "scaffold-sepolia-account-1" --address ${process.env.ACCOUNT_ADDRESS_SEPOLIA} --private-key ${process.env.PRIVATE_KEY_SEPOLIA} --type argent --add-profile "scaffold-sepolia-account-1" && 
      pwd && cd scripts && sncast --account scaffold-sepolia-account-1 script run deploy_script --url ${process.env.RPC_URL_SEPOLIA}
    `;
  } else if (network === "devnet") {
    console.log(
      "No network specified. Running deployment on Devnet by default..."
    );
    command = `
      sncast account import --url ${process.env.RPC_URL_DEVNET} --name "scaffold-devnet-account-1" --address ${process.env.ACCOUNT_ADDRESS_DEVNET} --private-key ${process.env.PRIVATE_KEY_DEVNET} --type oz --add-profile "scaffold-devnet-account-1" && 
      pwd && cd scripts && sncast --account scaffold-devnet-account-1 script run deploy_script --url ${process.env.RPC_URL_DEVNET}
    `;
  } else if (network === "mainnet") {
    console.log("mainnet specified. Running...");
    command = `
      sncast account import --url ${process.env.RPC_URL_MAINNET} --name "scaffold-mainnet-account-1" --address ${process.env.ACCOUNT_ADDRESS_MAINNET} --private-key ${process.env.PRIVATE_KEY_MAINNET} --type argent --add-profile "scaffold-mainnet-account-1" && 
      pwd && cd scripts && sncast --account scaffold-mainnet-account-1 script run deploy_script --url ${process.env.RPC_URL_MAINNET}
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

function main() {
  if (command === "deploy") {
    loadEnvVariables(envFilePath);
    deploy(network);
  } else {
    console.error("Invalid Command");
  }
}

if (typeof module !== "undefined" && require.main === module) {
  main();
}
