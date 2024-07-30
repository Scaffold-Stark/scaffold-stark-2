#!/bin/bash
# Exit immediately if a command exits with a non-zero status and ensures that the entire pipeline returns an error if any command fails
set -e
set -o pipefail

# Load environment variables from .env file
if [ -f "./.env" ]; then
  while IFS='=' read -r key value; do
    # Skip lines starting with '#' (comments) and empty lines
    [[ $key =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    export "$key=$value"
  done < .env
else
  echo ".env file not found."
  exit 1
fi

function generate_name_string() {
  local length="$1"
  head /dev/urandom | od -An -t x | awk -v len="$length" '{ 
    gsub(/ /, "", $0); 
    printf substr($0, 1, len) 
  }'
}

function stark_deploy() {
  local network="${2:-devnet}"
  local deployer_name=$(generate_name_string 8)

  local output=""
  local classHash=""
  local address=""
  local deployment_transaction_hash=""
   local final_contract_name="YourContract"

  if [ "$network" == "sepolia" ]; then
    echo "sepolia network specified. Running..."
    # temporary fix to remove existing build before running cairo script
    output=$(cd contracts && cd cairoscripts && rm -rf cairoscripts_alpha-sepolia_state.json && cd .. && rm -rf target && scarb build && sncast --url $RPC_URL_SEPOLIA account add --name "$deployer_name" --address $ACCOUNT_ADDRESS_SEPOLIA --private-key $PRIVATE_KEY_SEPOLIA --type oz && sncast --url $RPC_URL_SEPOLIA --account "$deployer_name" script run cairoscripts --package cairoscripts && ts-node ../scripts-ts/helpers/parse-deployments.ts )
  elif [ "$network" == "devnet" ]; then
    echo "no network specified. Running deployment on Devnet by default..."
    # temporary fix to remove existing build before running cairo script
    output=$(cd contracts && cd cairoscripts && rm -rf cairoscripts_alpha-sepolia_state.json && cd .. && rm -rf target && scarb build && sncast --url $RPC_URL_DEVNET account add --name "$deployer_name" --address $ACCOUNT_ADDRESS_DEVNET --private-key $PRIVATE_KEY_DEVNET --type oz && sncast --url $RPC_URL_DEVNET --account "$deployer_name" script run cairoscripts --package cairoscripts && ts-node ../scripts-ts/helpers/parse-deployments.ts)
  else
    echo "Invalid command for starkdeployer. Use: yarn starkdeployer or yarn starkdeployer --network <sepolia>"
    return 1
  fi

  

  # Parse the output to extract the relevant information
  classHash=$(echo "$output" | grep -o 'class_hash: [0-9]\+' | cut -d' ' -f2)
  address=$(echo "$output" | grep -o 'contract_address: [0-9]\+' | cut -d' ' -f2)
  deployment_transaction_hash=$(echo "$output" | grep -o 'transaction_hash: [0-9]\+' | cut -d' ' -f2)

 # Convert to hexadecimal using bc
  classHash=$(echo "obase=16; $classHash" | bc | awk '{print "0x" tolower($0)}')
  address=$(echo "obase=16; $address" | bc | awk '{print "0x" tolower($0)}')
  deployment_transaction_hash=$(echo "obase=16; $deployment_transaction_hash" | bc | awk '{print "0x" tolower($0)}')
 
  echo "Class Hash: $classHash"
  echo "Deployed Contract Address: $address"
  echo "Deployed Transaction Hash: $deployment_transaction_hash"

  # # Update the deployments JSON file
  local networkPath="./deployments/${network}_latest.json"
  local new_deployment=$(jq -n --arg finalContractName "$final_contract_name" --arg network "$network" --arg classHash "$classHash" --arg address "$address" --arg deployment_transaction_hash "$deployment_transaction_hash" --arg contract "$final_contract_name" '{($finalContractName): {network: $network, classHash: $classHash, address: $address, deployment_transaction_hash: $deployment_transaction_hash, "contract": $contract}}')

  if [ -f "$networkPath" ]; then
    currentTimestamp=$(date +%s)
    mv "$networkPath" "${networkPath/_latest.json/_${currentTimestamp}.json}"
  fi

  echo "$new_deployment" | jq '.' > "$networkPath"
}

# Main script
while [[ "$#" -gt 0 ]]; do
  case $1 in
    starkdeploy)
      COMMAND="starkdeploy"
      shift
      ;;
    --network)
      NETWORK="$2"
      shift 2
      ;;
    *)
      echo "Invalid Command"
      exit 1
      ;;
  esac
done

if [ "$COMMAND" == "starkdeploy" ]; then
  stark_deploy "$NAME" "$NETWORK"
else
  echo "Invalid Command"
fi

#to do : error handling when command fail, exit with appropriate error message.
#to do: dynamically obtain contract name rather than hardcoding 