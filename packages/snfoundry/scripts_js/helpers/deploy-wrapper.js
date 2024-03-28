#!/usr/bin/env node
var argv = require("yargs/yargs")(process.argv.slice(2)).parse();

// Set the NETWORK environment variable based on the --network argument
process.env.NETWORK = argv.network || "devnet";

// Execute the deploy script
require("child_process").execSync(
  "cd contracts && scarb build && node ../scripts_js/deploy.js --network " +
    process.env.NETWORK +
    " && node ../scripts_js/helpers/parseDeployments.js",
  { stdio: "inherit" }
);
