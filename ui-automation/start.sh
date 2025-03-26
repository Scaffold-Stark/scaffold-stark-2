#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$SCRIPT_DIR"

# docker compose build --no-cache nextjs

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

echo "Starting sequential tests..."

TEST_FILES=$(docker compose exec playwright find /app/tests -name "*.spec.ts" | sort)

for test_file in $TEST_FILES; do
    test_name=$(basename "$test_file")
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
echo "All tests completed!"