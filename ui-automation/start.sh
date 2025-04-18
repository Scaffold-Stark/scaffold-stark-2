#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$SCRIPT_DIR"

docker compose up --build -d

echo "Waiting for starknet-devnet to start..."
while ! curl -s http://localhost:5050 > /dev/null; do
    sleep 1
done

echo "Waiting for nextjs to start..."
while ! curl -s http://localhost:3000 > /dev/null; do
    sleep 1
done

echo "Setup complete! You can now access:"
echo "- Starknet Devnet: http://localhost:5050"
echo "- NextJS App: http://localhost:3000"

echo "Starting sequential tests..."

TEST_FILES=$(docker compose exec playwright find /app/tests -name "*.spec.ts" | sort)

for test_file in $TEST_FILES; do
    test_name=$(basename "$test_file")
    
    # Skip argentx-wallet-interaction.spec.ts as it will be run at the end
    if [[ "$test_name" == "argentx-wallet-interaction.spec.ts" ]]; then
        continue
    fi
    
    echo "Running test: $test_name"
    docker compose exec playwright npx playwright test "$test_file" --reporter=list
    
    if [ $? -eq 0 ]; then
        echo "✅ Test $test_name completed successfully"
    else
        echo "❌ Test $test_name failed"
    fi
    
    echo "Moving to next test in 3 seconds... (Press Ctrl+C to stop)"
    sleep 3
done

echo "All regular tests completed!"

# Modify scaffold.config.ts to use Sepolia network
echo "Modifying scaffold.config.ts to use Sepolia network..."
docker compose exec nextjs sed -i 's/chains.devnet/chains.sepolia/g' packages/nextjs/scaffold.config.ts

# Wait for NextJS to redeploy
echo "Waiting for NextJS to redeploy with new configuration..."
while ! curl -s http://localhost:3000 > /dev/null; do
    sleep 1
done
echo "NextJS redeployed successfully!"

Run the argentx-wallet-interaction test
echo "Running argentx-wallet-interaction test..."
docker compose exec playwright npx playwright test "/app/tests/argentx-wallet-interaction.spec.ts" --reporter=list

if [ $? -eq 0 ]; then
    echo "✅ argentx-wallet-interaction test completed successfully"
else
    echo "❌ argentx-wallet-interaction test failed"
fi

echo "All tests completed!"

export DEBUG=pw:api