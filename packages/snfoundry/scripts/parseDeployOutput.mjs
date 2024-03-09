const fs = require('fs');
const path = require('path');

// Assuming the output is stored in 'deployOutput.txt'
const outputFilePath = path.join(__dirname, 'deployOutput.txt');
const output = fs.readFileSync(outputFilePath, 'utf8');

// Regex to match the deployed contract address
const addressRegex = /Deployed the contract to address: (\d+)/;
const match = output.match(addressRegex);

if (match) {
  const address = match[1];

  // Extract the ABI from deploy_HelloStarknet.compiled_contract_class.json
  const compiledContractClassFilePath = path.join(__dirname, 'deploy', 'target', 'dev', 'deploy_HelloStarknet.contract_class.json');
  const compiledContractClass = JSON.parse(fs.readFileSync(compiledContractClassFilePath, 'utf8'));

  const abi = compiledContractClass.abi;

  // Create the result object
  const result = {
    address: address,
    abi: abi
  };

  // Write the result object to result.json
  const resultFilePath = path.join(__dirname, 'result.json');
  fs.writeFileSync(resultFilePath, JSON.stringify(result, null, 2));
  console.log(`Result written to ${resultFilePath}`);
} else {
  console.error('Deployed contract address not found in output.');
}