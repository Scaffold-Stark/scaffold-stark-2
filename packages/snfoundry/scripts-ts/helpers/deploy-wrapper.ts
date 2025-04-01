#!/usr/bin/env node
import yargs from "yargs";
import { execSync } from "child_process";

interface CommandLineOptions {
  _: string[];
  $0: string;
  network?: string;
  reset?: boolean;
}

function main() {
  const argv = yargs(process.argv.slice(2))
    .option("network", {
      type: "string",
      choices: ["devnet", "sepolia", "mainnet"],
      default: "devnet",
      description: "Specify the network to deploy to",
    })
    .option("reset", {
      type: "boolean",
      description: "Reset deployments (remove existing deployments)",
      default: true,
      hidden: true,
    })
    .option("no-reset", {
      type: "boolean",
      description: "Do not reset deployments (keep existing deployments)",
      default: false,
    })
    .demandOption(["network"])
    .help()
    .parseSync() as CommandLineOptions;

  if (argv._.length > 0) {
    console.error(
      `❌ Invalid arguments, only --network or --no-reset can be passed in`
    );
    return;
  }

  const resetFlag = argv.reset === false ? "--no-reset" : "";

  try {
    const command =
      `cd contracts && scarb build && ts-node ../scripts-ts/deploy.ts` +
      ` --network ${argv.network || "devnet"}` +
      `${resetFlag ? " " + resetFlag : ""}` +
      ` && ts-node ../scripts-ts/helpers/parse-deployments.ts && cd ..`;

    execSync(command, { stdio: "inherit" });
  } catch (error) {
    console.error("Error during deployment:", error);
  }
}

if (require.main === module) {
  main();
}
