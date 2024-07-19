const contractNameRule = require("./eslint-plugin-contract-names");
const plugin = {rules: {"contract-name": contractNameRule}};
module.exports = plugin;