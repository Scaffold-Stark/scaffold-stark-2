// scripts_js/deploy-wrapper.js
const argv = require("yargs/yargs")(process.argv.slice(2)).argv;

// Set the NETWORK environment variable based on the --network argument
process.env.NETWORK = argv.network || "devnet";

// Execute the deploy script
require("child_process").execSync(
  "scarb build && node scripts_js/deploy.js --network " +
    process.env.NETWORK +
    " && node ./scripts_js/helpers/parseDeployOutput.js",
  { stdio: "inherit" }
);
