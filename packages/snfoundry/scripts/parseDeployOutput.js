const fs = require('fs');
const path = require('path');
// Assuming the output is stored in 'deployOutput.txt'
const outputFilePath = path.join(__dirname, 'deployOutput.txt');
const output = fs.readFileSync(outputFilePath, 'utf8');

// Regex to match the deployed contract address and class hash
const addressRegex = /Deployed the contract to address: (\d+)/;
const classHashRegex = /Class hash of the declared contract: (\d+)/;

const addressMatch = output.match(addressRegex);
const classHashMatch = output.match(classHashRegex);

if (addressMatch && classHashMatch) {
  const address = addressMatch[1];
  const classHash = classHashMatch[1];


  // Extract the ABI from deploy_HelloStarknet.compiled_contract_class.json
  const compiledContractClassFilePath = path.join(__dirname, 'deploy', 'target', 'dev', 'deploy_HelloStarknet.contract_class.json');
  const compiledContractClass = JSON.parse(fs.readFileSync(compiledContractClassFilePath, 'utf8'));

  const abi = compiledContractClass.abi;

  // Create the result object
  const result = {
    address: address,
    classHash: classHash,
    abi: abi
  };

  // Write the result object to result.json
  const resultFilePath = path.join(__dirname, 'result.json');
  fs.writeFileSync(resultFilePath, JSON.stringify(result, null, 2));
  console.log(`Result written to ${resultFilePath}`);
  const parentFolderPath = path.join(__dirname, '..', '..', 'nextjs', 'src', 'contracts', 'result.json');
  fs.copyFileSync(resultFilePath, parentFolderPath);
  console.log(`Result copied to ${parentFolderPath}`);
} else {
  console.error('Deployed contract address not found in output.');
}