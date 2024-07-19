const fs = require('fs');
const path = require('path');

// Function to get contract names from src directory
function getContractNames() {
  const srcPath = path.resolve(__dirname, '..', 'contracts/src');
  const files = fs.readdirSync(srcPath);
  return files
    .filter(file => file.endsWith('.cairo') && file !== 'lib.cairo')
    .map(file => {
      const filePath = path.join(srcPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const match = content.match(/#\[starknet::contract\]\s*mod\s+(\w+)/);
      return match ? match[1] : null;
    })
    .filter(Boolean);
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Invalid contract name.",
      fixable: "code",
      schema: []
    }
  },
  create(context) {
    const contractNames = getContractNames();
    
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
              message: "Invalid contract name. Must be one of: {{contractNames}}",
              data: {
                contractNames: contractNames.join(', ')
              }
            });
          }
        }
      }
    };
  }
};