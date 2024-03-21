#!/usr/bin/env node
var argv = require('yargs/yargs')(process.argv.slice(2)).parse();
// const argv = import("yargs/yargs");


// Set the NETWORK environment variable based on the --network argument
process.env.NETWORK = argv.network || "devnet";


console.log(process.env.NETWORK);

// Execute the deploy script
require("child_process").execSync(
  "scarb build && node scripts_js/deploy.js --network " +
    process.env.NETWORK +
    " && node ./scripts_js/helpers/parseDeployOutput.js",
  { stdio: "inherit" }
);
