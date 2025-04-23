#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [[ "$1" == "--ci" ]]; then
  echo "Running in CI mode"
  docker compose up -d
else
  echo "Running in local mode"
  docker compose up --build -d
fi

echo "Waiting for services to start..."
while ! curl -s http://localhost:5050 > /dev/null || ! curl -s http://localhost:3000 > /dev/null; do
    sleep 1
done

echo "Starting tests..."
TEST_FILES=$(find . -name "*.spec.ts" ! -name "argentx-wallet-interaction.spec.ts")

echo "Running tests in parallel"
docker compose exec playwright npx playwright test $TEST_FILES --reporter=list --workers=2

echo "Modifying config for Sepolia..."
docker compose exec nextjs sed -i 's/chains.devnet/chains.sepolia/g' packages/nextjs/scaffold.config.ts

echo "Waiting 10s for redeploy..."

sleep 10

while ! curl -s http://localhost:3000 > /dev/null; do
    sleep 1
done

echo "Running argentx test..."
docker compose exec playwright npx playwright test "/app/tests/argentx-wallet-interaction.spec.ts" --reporter=list
[ $? -eq 0 ] && echo "✅ argentx test passed" || echo "❌ argentx test failed"
