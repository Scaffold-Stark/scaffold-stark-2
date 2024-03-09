const fs = require('fs');
const path = require('path');

// Assuming the output is stored in 'deployOutput.txt'
const outputFilePath = path.join(__dirname, 'deployOutput.txt');
const output = fs.readFileSync(outputFilePath, 'utf8');

// Regex to match the deployed contract address and class hash
const addressRegex = /Address (0x[0-9a-fA-F]+)/;
const classHashRegex = /Class Hash (0x[0-9a-fA-F]+)/;
const addressMatch = output.match(addressRegex);
const classHashMatch = output.match(classHashRegex);

if (addressMatch && classHashMatch) {
  const address = addressMatch[1];
  const classHash = classHashMatch[1];

  // Extract the ABI directly from deployOutput.txt
  const abiRegex = /ABI (\[[\s\S]*\])/;
  const abiMatch = output.match(abiRegex);
  let abi;
  if (abiMatch) {
    abi = JSON.parse(abiMatch[1]);
  } else {
    console.error('ABI not found in output.');
    return;
  }

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
  console.error('Deployed contract address or class hash not found in output.');
}