import path from 'path';
import { execSync } from 'child_process';
import yargs from 'yargs';
// Import deployedContracts
import deployedContracts from '../../nextjs/contracts/deployedContracts';

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

// Change to the contracts directory
const contractsDir = path.resolve(__dirname, '../contracts');
process.chdir(contractsDir);

// Verify each contract
Object.entries(deployedContracts[network]).forEach(([contractName, contractInfo]: [string, any]) => {
  const { address } = contractInfo;
  
  console.log(`Verifying ${contractName} on ${network}...`);
  
  try {
    execSync(
      `sncast verify --contract-address ${address} --contract-name ${contractName} --network ${network} --verifier walnut --confirm-verification` ,
      { stdio: 'inherit' }
    );
    console.log(`Successfully verified ${contractName}`);
  } catch (error) {
    console.error(`Failed to verify ${contractName}:`, error);
  }
});

console.log('Verification process completed.');