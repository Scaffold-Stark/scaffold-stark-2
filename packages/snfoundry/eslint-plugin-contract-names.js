const fs = require('fs');
const path = require('path');

// Function to get contract names from src directory
function getContractNames() {
  const srcPath = path.resolve(__dirname, 'contracts/src');
  const files = fs.readdirSync(srcPath);
  return files
    .filter(file => file.endsWith('.cairo') && file !== 'lib.cairo')
    .map(file => path.basename(file, '.cairo'));
}

const contractNames = getContractNames();

module.exports = {
  rules: {
    'valid-contract-name': {
      create(context) {
        return {
          CallExpression(node) {
            if (
              node.callee.name === 'deployContract' &&
              node.arguments.length >= 2
            ) {
              const contractNameArg = node.arguments[1];
              if (
                contractNameArg.type === 'Literal' &&
                !contractNames.includes(contractNameArg.value)
              ) {
                context.report({
                  node: contractNameArg,
                  message: `Invalid contract name. Must be one of: ${contractNames.join(', ')}`
                });
              }
            }
          }
        };
      }
    }
  }
};