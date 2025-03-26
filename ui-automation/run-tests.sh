#!/bin/bash

HEADED_MODE=${1:-false}
HEADED_FLAG=""

if [ "$HEADED_MODE" = "true" ]; then
  HEADED_FLAG="--headed"
  echo "Running tests in UI mode (--headed)"
else
  echo "Running tests in headless mode"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

TEST_FILES=(
  "connect-wallet.spec.ts"
  "debug-contract-eth.spec.ts"
  "debug-contract-strk.spec.ts"
  "debug-contract-arrays-span.spec.ts"
  "debug-contract-structs.spec.ts"
  "debug-contract-vars.spec.ts"
)

PLAYWRIGHT_CONTAINER="ui-automation-playwright-1"

FAILED_TESTS=()
PASSED_TESTS=()

for test_file in "${TEST_FILES[@]}"; do
  echo "================================================="
  echo "Running test: $test_file"
  echo "================================================="
  
  if docker compose exec playwright npx playwright test "$test_file" $HEADED_FLAG; then
    echo "✅ Test passed: $test_file"
    PASSED_TESTS+=("$test_file")
  else
    echo "❌ Test failed: $test_file"
    FAILED_TESTS+=("$test_file")
  fi
  
  sleep 2
done

echo "===================== TEST SUMMARY ====================="
echo "Total tests: ${#TEST_FILES[@]}"
echo "Passed: ${#PASSED_TESTS[@]}"
echo "Failed: ${#FAILED_TESTS[@]}"

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
  echo "Failed tests:"
  for test in "${FAILED_TESTS[@]}"; do
    echo "  - $test"
  done
  exit 1
else
  echo "All tests passed successfully!"
  exit 0
fi