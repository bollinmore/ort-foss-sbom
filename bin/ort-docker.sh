#!/usr/bin/env bash
set -euo pipefail

# Wrapper to run ORT CLI from Docker, using the project root as /work.
# Adjust the image tag if you need a specific ORT version.

IMAGE="${ORT_IMAGE:-ghcr.io/oss-review-toolkit/ort:latest}"
PLATFORM="${ORT_PLATFORM:-linux/amd64}"
HOST_WORKDIR="${ORT_WORKDIR:-$PWD}"
CONTAINER_WORKDIR="${ORT_CONTAINER_WORKDIR:-/work}"

IS_MSYS=0
if uname | grep -qiE 'mingw|msys'; then
  IS_MSYS=1
fi

to_windows_path() {
  local p="$1"
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -w "$p"
  elif (cd "$p" >/dev/null 2>&1 && pwd -W 2>/dev/null); then
    (cd "$p" && pwd -W)
  else
    echo "$p"
  fi
}

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

HOST_MOUNT_PATH="$HOST_WORKDIR"
if [[ "$IS_MSYS" -eq 1 ]]; then
  HOST_MOUNT_PATH="$(to_windows_path "$HOST_WORKDIR")"
  # Prevent MSYS from rewriting container paths such as /work to C:\Program Files\Git\work.
  export MSYS_NO_PATHCONV=1
  export MSYS2_ARG_CONV_EXCL="*"
fi

DOCKER_ARGS=(
  --rm
  --platform "$PLATFORM"
  -v "${HOST_MOUNT_PATH}:${CONTAINER_WORKDIR}"
  -w "${CONTAINER_WORKDIR}"
)

if [[ -n "$SCAN_TARGET_HOST" ]]; then
  SCAN_MOUNT_HOST="$SCAN_TARGET_HOST"
  if [[ "$IS_MSYS" -eq 1 ]]; then
    SCAN_MOUNT_HOST="$(to_windows_path "$SCAN_TARGET_HOST")"
  fi
  # ORT/NPM may create temp files under the scan path; mount read-write.
  DOCKER_ARGS+=(-v "${SCAN_MOUNT_HOST}:${SCAN_TARGET_CONTAINER}:rw")
  # If repo has a root .ort.yml, mount it into the scan target so excludes apply.
  if [[ -f "${HOST_WORKDIR}/.ort.yml" ]]; then
    dot_ort_host="${HOST_WORKDIR}/.ort.yml"
    if [[ "$IS_MSYS" -eq 1 ]]; then
      dot_ort_host="$(to_windows_path "$dot_ort_host")"
    fi
    DOCKER_ARGS+=(-v "${dot_ort_host}:${SCAN_TARGET_CONTAINER}/.ort.yml:ro")
  fi
fi

run_docker() {
  local attempt=1
  local max_attempts="${ORT_DOCKER_RETRIES:-2}"

  while (( attempt <= max_attempts )); do
    local tmp_err
    tmp_err="$(mktemp)"
    if docker run "${DOCKER_ARGS[@]}" "$IMAGE" "${ARGS[@]}" 2> >(tee "$tmp_err" >&2); then
      rm -f "$tmp_err"
      return 0
    fi
    local status=$?
    local err_text
    err_text="$(cat "$tmp_err")"
    rm -f "$tmp_err"
    if (( attempt < max_attempts )) && [[ "$err_text" == *"unexpected EOF"* ]]; then
      echo "Retrying docker run due to 'unexpected EOF' (attempt $((attempt + 1))/${max_attempts})" >&2
      attempt=$((attempt + 1))
      sleep 2
      continue
    fi
    return $status
  done
}

run_docker
