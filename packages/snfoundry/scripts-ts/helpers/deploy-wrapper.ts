#!/usr/bin/env node
import yargs from "yargs";
import { execSync } from "child_process";

interface CommandLineOptions {
  _: string[]; // Non-hyphenated arguments are usually under the `_` key
  $0: string; // The script name or path is under the `$0` key
  network?: string; // The --network option
  noreset?: boolean;
  fee?: string;
}

const argv = yargs(process.argv.slice(2))
  .options({
    network: { type: "string" },
    fee: { type: "string", choices: ["eth", "strk"], default: "eth" },
    noreset: {
      type: "boolean",
      description: "Do not reset deployments (keep existing deployments)",
      default: false,
    },
  })
  .parseSync() as CommandLineOptions;

// Set the NETWORK environment variable based on the --network argument
process.env.NETWORK = argv.network || "devnet";
process.env.FEE_TOKEN = argv.fee || "eth";
process.env.NO_RESET = argv.noreset ? "true" : "false";

// Execute the deploy script without the reset option
try {
  execSync(
    `cd contracts && scarb build && ts-node ../scripts-ts/deploy.ts` +
      ` --network ${process.env.NETWORK}` +
      ` --fee ${process.env.FEE_TOKEN}` +
      ` --noreset ${process.env.NO_RESET}` +
      ` && ts-node ../scripts-ts/helpers/parse-deployments.ts && cd ..`,
    { stdio: "inherit" }
  );
} catch (error) {
  console.error("Error during deployment:", error);
}
