#!/bin/bash

## Extract the version of scarb installed in local machine
local_scarb_version=$(echo $(scarb --version) | grep -oP '\b\d+\.\d+\.\d+\b' | head -n 1)

## Extract the version of scarb from Scarb.toml used by scaffold
scarb_dependence=$(cd .. && grep 'starknet =' Scarb.toml)
scaffold_scarb_version=$(echo $scarb_dependence | grep -oP 'starknet = ">=\K[^"]+')

if [ "$local_scarb_version" != "$scaffold_scarb_version" ]; then
    echo "Installing Scarb v$scaffold_scarb_version!!!"
    curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh -s -- -v $scaffold_scarb_version
else
    echo "Scarb v$local_scarb_version is already installed. Skipping installation."
fi
