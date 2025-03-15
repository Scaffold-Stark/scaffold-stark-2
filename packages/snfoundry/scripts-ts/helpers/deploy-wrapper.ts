#!/usr/bin/env node
import yargs from "yargs";
import { execSync } from "child_process";

interface CommandLineOptions {
  _: string[]; // Non-hyphenated arguments are usually under the `_` key
  $0: string; // The script name or path is under the `$0` key
  network?: string; // The --network option
  reset?: boolean;
  fee?: string;
  "no-reset"?: boolean;
}

function main() {
  const argv = yargs(process.argv.slice(2))
    .option("network", {
      type: "string",
      choices: ["devnet", "sepolia", "mainnet"],
      default: "devnet",
    })
    .option("fee", { type: "string", choices: ["eth", "strk"], default: "eth" })
    .option("no-reset", {
      type: "boolean",
      description: "Do not reset deployments (keep existing deployments)",
      default: false,
    })
    .demandOption(["network", "fee"])
    .parseSync() as CommandLineOptions;

  if (argv._.length > 0) {
    console.error(
      `❌ Invalid arguments, only --network, --fee, or --reset/--no-reset can be passed in`
    );
    return;
  }

  // Execute the deploy script without the reset option
  try {
    execSync(
      `cd contracts && scarb build && ts-node ../scripts-ts/deploy.ts` +
        ` --network ${argv.network || "devnet"}` +
        ` --fee ${argv.fee || "eth"}` +
        ` ${argv["no-reset"] ? "--no-reset" : ""}` +
        ` && ts-node ../scripts-ts/helpers/parse-deployments.ts && cd ..`,
      { stdio: "inherit" }
    );
  } catch (error) {
    console.error("Error during deployment:", error);
  }
}

if (require.main === module) {
  main();
}
