#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

docker compose down

docker rmi ui-automation-playwright:latest
docker rmi ui-automation-nextjs:latest
