const path = require('path');
const eslintPluginContractNames = require('./eslint-plugin-contract-names');

module.exports = [
  {
    plugins: {
      'contract-names': eslintPluginContractNames
    },
    rules: {
      'contract-names/valid-contract-name': 'error'
    }
  }
];