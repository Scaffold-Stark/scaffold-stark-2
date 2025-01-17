#!/usr/bin/env node
import yargs from "yargs";
import { execSync } from "child_process";

interface CommandLineOptions {
  _: string[]; // Non-hyphenated arguments are usually under the `_` key
  $0: string; // The script name or path is under the `$0` key
  network?: string; // The --network option
  reset?: boolean;
  fee?: string;
}

function main() {
  const argv = yargs(process.argv.slice(2))
    .options({
      network: { type: "string", default: "devnet" },
      fee: { type: "string", choices: ["eth", "strk"], default: "eth" },
      reset: {
        type: "boolean",
        description: "Do not reset deployments (keep existing deployments)",
        default: true,
      },
    })
    .demandOption(["network", "fee", "reset"])
    .parseSync() as CommandLineOptions;

  if (argv._.length > 0) {
    console.error(
      `❌ Invalid arguments, only --network, --fee, or --reset/--no-reset can be passed in`,
    );
    return;
  }

  // Set the NETWORK environment variable based on the --network argument
  process.env.NETWORK = argv.network || "devnet";
  process.env.FEE_TOKEN = argv.fee || "eth";
  process.env.RESET = argv.reset ? "true" : "false";

  console.log(process.env.NETWORK, process.env.FEE_TOKEN, process.env.NO_RESET);

  // Execute the deploy script without the reset option
  try {
    execSync(
      `cd contracts && scarb build && ts-node ../scripts-ts/deploy.ts` +
        ` --network ${process.env.NETWORK}` +
        ` --fee ${process.env.FEE_TOKEN}` +
        ` --reset ${process.env.RESET}` +
        ` && ts-node ../scripts-ts/helpers/parse-deployments.ts && cd ..`,
      { stdio: "inherit" },
    );
  } catch (error) {
    console.error("Error during deployment:", error);
  }
}

if (require.main === module) {
  main();
}
