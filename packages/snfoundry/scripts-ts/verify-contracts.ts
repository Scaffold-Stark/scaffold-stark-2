import path from 'path';
import { execSync } from 'child_process';
import yargs from 'yargs';
import fs from 'fs';
import { green, red, yellow } from "./helpers/colorize-log";

// Import deployedContracts
import deployedContracts from '../../nextjs/contracts/deployedContracts';

function main() {
  // Parse command line arguments
  const argv = yargs(process.argv.slice(2))
    .option('network', {
      type: 'string',
      description: 'Specify the network mainnet or sepolia',
      demandOption: true,
    })
    .parseSync();

  const network = argv.network;

  if (!deployedContracts[network]) {
    console.error(`No deployed contracts found for network: ${network}`);
    process.exit(1);
  }

  // Read and parse the deploy.ts file
  const deployFilePath = path.resolve(__dirname, 'deploy.ts');
  const deployFileContent = fs.readFileSync(deployFilePath, 'utf-8');
  
  // Remove comments and extract contract names
  const contractsToVerify = deployFileContent
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') 
    .match(/contract:\s*"([^"]+)"/g)
    ?.map(match => match.split('"')[1]) || [];

  // Change to the contracts directory
  const contractsDir = path.resolve(__dirname, '../contracts');
  process.chdir(contractsDir);

  // Verify each contract
  Object.entries(deployedContracts[network]).forEach(([contract, contractInfo]: [string, any]) => {
    if (contractsToVerify.includes(contract)) {
      const { address } = contractInfo;
      console.log(yellow(`Verifying ${contract} on ${network}...`));
      try {
        execSync(
          `sncast verify --contract-address ${address} --contract-name ${contract} --network ${network} --verifier walnut --confirm-verification`,
          { stdio: 'inherit' }
        );
        console.log(green("Successfully verified"), contract);
      } catch (error) {
        console.error(red(`Failed to verify ${contract}:`), error);
      }
    }
  });
  console.log(green("✅ Verification process completed."));
}

if (typeof module !== "undefined" && require.main === module) {
  main();
}