#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$SCRIPT_DIR"

HEADED_MODE=${1:-false}

docker compose up -d

echo "Waiting for starknet-devnet to start..."
while ! curl -s http://localhost:5050 > /dev/null; do
    sleep 1
done

echo "Waiting for next js to start..."
while ! curl -s http://localhost:3000 > /dev/null; do
    sleep 1
done

echo "Setup complete! You can now access:"
echo "- Starknet Devnet: http://localhost:5050"
echo "- NextJS App: http://localhost:3000"

bash ./run-tests.sh "$HEADED_MODE"