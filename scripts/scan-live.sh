#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f ".env" ]]; then
  echo "Missing .env. Copy .env.sample and set values (INTEGRATION_MODE=live, FOSSOLOGY_MODE=live, etc.)."
  exit 1
fi

# Load .env into the current shell
set -a
source .env
set +a

# Ensure ORT_CLI_PATH points to docker wrapper if not set
export ORT_CLI_PATH="${ORT_CLI_PATH:-./bin/ort-docker.sh}"

if [[ $# -lt 1 ]]; then
  echo "Usage: scripts/scan-live.sh /absolute/path/to/project"
  exit 1
fi

PROJECT_PATH="$1"

echo "Running live scan with ORT_CLI_PATH=${ORT_CLI_PATH}, INTEGRATION_MODE=${INTEGRATION_MODE:-fixture}, FOSSOLOGY_MODE=${FOSSOLOGY_MODE:-stub}"
npm run scan -- "$PROJECT_PATH"
