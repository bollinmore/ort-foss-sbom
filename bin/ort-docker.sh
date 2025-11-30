#!/usr/bin/env bash
set -euo pipefail

# Wrapper to run ORT CLI from Docker, using the project root as /work.
# Adjust the image tag if you need a specific ORT version.

IMAGE="${ORT_IMAGE:-ghcr.io/oss-review-toolkit/ort:latest}"

# Allow overriding workdir/output via env; defaults to current repo root.
WORKDIR="${ORT_WORKDIR:-$PWD}"

docker run --rm \
  -v "${WORKDIR}:/work" \
  -w /work \
  "$IMAGE" \
  "$@"
