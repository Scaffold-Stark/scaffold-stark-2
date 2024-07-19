"use strict";

const eslintPluginContractNames = require('./eslint-contract-name/index');

module.exports = [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      'contract-names': eslintPluginContractNames
    },
    rules: {
      'contract-names/contract-name': 'error'
    }
  }
];