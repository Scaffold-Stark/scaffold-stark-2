#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

docker compose up --build -d

echo "Waiting for services to start..."
while ! curl -s http://localhost:5050 > /dev/null || ! curl -s http://localhost:3000 > /dev/null; do
    sleep 1
done

echo "Starting tests..."
TEST_FILES=$(docker compose exec playwright find /app/tests -name "*.spec.ts" | sort)

for test_file in $TEST_FILES; do
    test_name=$(basename "$test_file")
    if [[ "$test_name" == "argentx-wallet-interaction.spec.ts" ]]; then
        continue
    fi
    
    echo "Running: $test_name"
    docker compose exec playwright npx playwright test "$test_file" --reporter=list
    [ $? -eq 0 ] && echo "✅ $test_name passed" || echo "❌ $test_name failed"
    sleep 3
done

echo "Modifying config for Sepolia..."
docker compose exec nextjs sed -i 's/chains.devnet/chains.sepolia/g' packages/nextjs/scaffold.config.ts

echo "Waiting for redeploy..."
while ! curl -s http://localhost:3000 > /dev/null; do
    sleep 1
done

echo "Running argentx test..."
docker compose exec playwright npx playwright test "/app/tests/argentx-wallet-interaction.spec.ts" --reporter=list
[ $? -eq 0 ] && echo "✅ argentx test passed" || echo "❌ argentx test failed"

export DEBUG=pw:api