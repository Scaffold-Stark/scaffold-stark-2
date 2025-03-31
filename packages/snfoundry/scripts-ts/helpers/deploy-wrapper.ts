#!/usr/bin/env node
import yargs from "yargs";
import { execSync } from "child_process";

interface CommandLineOptions {
  _: string[];
  $0: string;
  network?: string;
  noReset?: boolean;
}

function main() {
  const argv = yargs(process.argv.slice(2))
    .option("network", {
      type: "string",
      choices: ["devnet", "sepolia", "mainnet"],
      default: "devnet",
    })
    .option("no-reset", {
      type: "boolean",
      description: "Do not reset deployments (keep existing deployments)",
      default: false,
    })
    .demandOption(["network"])
    .parseSync() as CommandLineOptions;

  if (argv._.length > 0) {
    console.error(
      `❌ Invalid arguments, only --network or --no-reset can be passed in`
    );
    return;
  }

  try {
    execSync(
      `cd contracts && scarb build && ts-node ../scripts-ts/deploy.ts` +
        ` --network ${argv.network || "devnet"}` +
        ` ${argv.noReset ? "--no-reset" : ""}` +
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
