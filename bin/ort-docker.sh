#!/usr/bin/env bash
set -euo pipefail

# Wrapper to run ORT CLI from Docker, using the project root as /work.
# Adjust the image tag if you need a specific ORT version.

IMAGE="${ORT_IMAGE:-ghcr.io/oss-review-toolkit/ort:latest}"
PLATFORM="${ORT_PLATFORM:-linux/amd64}"
HOST_WORKDIR="${ORT_WORKDIR:-$PWD}"
CONTAINER_WORKDIR="${ORT_CONTAINER_WORKDIR:-/work}"

SCAN_TARGET_HOST=""
SCAN_TARGET_CONTAINER="/scan-target"

# Detect -i <path> and mount if it is absolute and exists outside the workdir.
ARGS=()
prev=""
for a in "$@"; do
  if [[ "$prev" == "-i" || "$prev" == "--input-dir" || "$prev" == "--input" ]]; then
    if [[ "$a" = /* && -d "$a" && "$a" != "$HOST_WORKDIR"* ]]; then
      SCAN_TARGET_HOST="$a"
      a="$SCAN_TARGET_CONTAINER"
    fi
  fi
  if [[ "$a" == "$HOST_WORKDIR"* ]]; then
    a="${a/$HOST_WORKDIR/$CONTAINER_WORKDIR}"
  fi
  ARGS+=("$a")
  prev="$a"
done

DOCKER_ARGS=(
  --rm
  --platform "$PLATFORM"
  -v "${HOST_WORKDIR}:${CONTAINER_WORKDIR}"
  -w "${CONTAINER_WORKDIR}"
)

if [[ -n "$SCAN_TARGET_HOST" ]]; then
  # ORT/NPM may create temp files under the scan path; mount read-write.
  DOCKER_ARGS+=(-v "${SCAN_TARGET_HOST}:${SCAN_TARGET_CONTAINER}:rw")
  # If repo has a root .ort.yml, mount it into the scan target so excludes apply.
  if [[ -f "${HOST_WORKDIR}/.ort.yml" ]]; then
    DOCKER_ARGS+=(-v "${HOST_WORKDIR}/.ort.yml:${SCAN_TARGET_CONTAINER}/.ort.yml:ro")
  fi
fi

docker run "${DOCKER_ARGS[@]}" "$IMAGE" "${ARGS[@]}"
