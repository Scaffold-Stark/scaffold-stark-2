#!/bin/bash
set -e

echo "RPC_URL_DEVNET: $RPC_URL_DEVNET"

if [ -z "$RPC_URL_DEVNET" ]; then
    echo "Error: RPC_URL_DEVNET is not set"
    exit 1
fi

while ! curl -s $RPC_URL_DEVNET > /dev/null; do
    echo "Waiting for devnet $RPC_URL_DEVNET to be ready..."
    sleep 2
done

cd /app/packages/snfoundry
yarn deploy

cd /app/packages/nextjs
exec yarn dev 