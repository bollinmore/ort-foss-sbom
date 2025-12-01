#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

usage() {
  echo "Usage: scripts/ort.sh <path-to-project>"
}

ENV_FILE="${ENV_FILE:-${REPO_ROOT}/.env}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Copy .env.sample and set values."
  exit 1
fi

resolve_abs_path() {
  local input_path="$1"
  if command -v realpath >/dev/null 2>&1; then
    realpath "${input_path}"
  else
    (cd "${input_path}" && pwd)
  fi
}

generate_job_id() {
  if [[ -n "${JOB_ID:-}" ]]; then
    echo "${JOB_ID}"
    return
  fi

  local ts=""
  if command -v node >/dev/null 2>&1; then
    ts="$(node -e 'console.log(Date.now())')" || true
  fi

  if [[ -z "${ts}" ]]; then
    ts="$(date +%s)"
  fi

  echo "job-${ts}"
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

if [[ ! -e "$1" ]]; then
  echo "Target path not found: $1"
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "${ENV_FILE}"
set +a

TARGET_PATH="$(resolve_abs_path "$1")"

if [[ ! -d "${TARGET_PATH}" ]]; then
  echo "Target path not found: ${TARGET_PATH}"
  exit 1
fi

OUTPUT_BASE="${OUTPUT_DIR:-${REPO_ROOT}/out}"
JOB_ID="$(generate_job_id)"
JOB_DIR="${OUTPUT_BASE}/${JOB_ID}"
OUTPUT_DIR="${JOB_DIR}/ort"
ORT_CLI="${ORT_CLI_PATH:-${REPO_ROOT}/bin/ort-docker.sh}"

mkdir -p "${OUTPUT_DIR}"
echo "Job: ${JOB_ID}"
echo "Output directory: ${OUTPUT_DIR}"

LOG_FLAGS=()
case "${ORT_LOG_LEVEL:-}" in
info)
  LOG_FLAGS+=(--info)
  ;;
debug)
  LOG_FLAGS+=(--debug)
  if [[ "${ORT_STACKTRACE:-}" == "1" ]]; then
    LOG_FLAGS+=(--stacktrace)
  fi
  ;;
esac

run_ort() {
  local subcommand="$1"
  shift
  "${ORT_CLI}" "${LOG_FLAGS[@]}" "${subcommand}" "$@"
}

resolve_output() {
  local dir="$1"
  shift
  for name in "$@"; do
    if [[ -f "${dir}/${name}" ]]; then
      echo "${dir}/${name}"
      return 0
    fi
  done
  return 1
}

ANALYZER_CANDIDATES=(
  analyzer-result.json
  analyzer-result.yml
  analyzer-result.yaml
  analyzer-result.spdx.json
)

SCANNER_CANDIDATES=(
  scan-result.spdx.json
  scan-result.json
  scan-result.yml
  scan-result.yaml
  scanner.spdx.json
)

SPDX_CANDIDATES=(
  sbom.spdx.json
  sbom.spdx.yml
  sbom.spdx.yaml
  bom.spdx.json
  bom.spdx.yml
  bom.spdx.yaml
  scan-report.spdx.json
  scan-report.spdx.yml
  scan-report.spdx.yaml
  report.spdx.json
  report.spdx.yml
  report.spdx.yaml
  scan-result.spdx.json
  scan-result.spdx.yml
  scan-result.spdx.yaml
  sbom.spdx
  scan-report.spdx
  report.spdx
  scan-result.spdx
  spdx.yml
  spdx.yaml
)

CYCLONEDX_CANDIDATES=(
  sbom.cyclonedx.json
  sbom.cyclonedx.xml
  scan-report.cyclonedx.json
  scan-report.cyclonedx.xml
  bom.cyclonedx.json
  bom.cyclonedx.xml
  bom.cdx.json
  cyclonedx.json
  cyclonedx.xml
)

echo "[ort] analyze -> ${TARGET_PATH}"
run_ort analyze -i "${TARGET_PATH}" --output-dir "${OUTPUT_DIR}"
ANALYZER_RESULT="$(resolve_output "${OUTPUT_DIR}" "${ANALYZER_CANDIDATES[@]}" || true)"

if [[ -z "${ANALYZER_RESULT}" ]]; then
  echo "Analyzer output missing in ${OUTPUT_DIR}"
  exit 1
fi

echo "[ort] scan -> ${ANALYZER_RESULT}"
run_ort scan -i "${ANALYZER_RESULT}" --output-dir "${OUTPUT_DIR}"
SCANNER_RESULT="$(resolve_output "${OUTPUT_DIR}" "${SCANNER_CANDIDATES[@]}" || true)"

if [[ -z "${SCANNER_RESULT}" ]]; then
  echo "Scanner output missing in ${OUTPUT_DIR}"
  exit 1
fi

echo "[ort] report (SPDX + CycloneDX)"
run_ort report \
  -i "${SCANNER_RESULT}" \
  --output-dir "${OUTPUT_DIR}" \
  -f SpdxDocument -O SpdxDocument=output.file.formats=json \
  -f CycloneDX -O CycloneDX=output.file.formats=json

SPDX_RESULT="$(resolve_output "${OUTPUT_DIR}" "${SPDX_CANDIDATES[@]}" || true)"
CYCLONEDX_RESULT="$(resolve_output "${OUTPUT_DIR}" "${CYCLONEDX_CANDIDATES[@]}" || true)"

# Fallback: if SPDX not produced, retry generating only SPDX with an explicit format.
if [[ -z "${SPDX_RESULT}" ]]; then
  echo "[ort] SPDX not found after first pass; retrying SpdxDocument only..."
  run_ort report \
    -i "${SCANNER_RESULT}" \
    --output-dir "${OUTPUT_DIR}" \
    -f SpdxDocument -O SpdxDocument=output.file.formats=json
  SPDX_RESULT="$(resolve_output "${OUTPUT_DIR}" "${SPDX_CANDIDATES[@]}" || true)"
fi

if [[ -z "${SPDX_RESULT}" ]]; then
  echo "SPDX SBOM not found in ${OUTPUT_DIR}"
  echo "Available files:"
  ls -l "${OUTPUT_DIR}"
  exit 1
fi

if [[ -z "${CYCLONEDX_RESULT}" ]]; then
  echo "CycloneDX SBOM not found in ${OUTPUT_DIR}"
  exit 1
fi

SPDX_EXT="json"
if [[ "${SPDX_RESULT}" == *.yml || "${SPDX_RESULT}" == *.yaml ]]; then
  SPDX_EXT="${SPDX_RESULT##*.}"
fi

FINAL_SPDX="${OUTPUT_DIR}/sbom.spdx.${SPDX_EXT}"
if [[ "${SPDX_RESULT}" != "${FINAL_SPDX}" ]]; then
  mv "${SPDX_RESULT}" "${FINAL_SPDX}"
fi

FINAL_CYCLONEDX="${OUTPUT_DIR}/sbom.cyclonedx.json"
if [[ "${CYCLONEDX_RESULT}" == *.xml ]]; then
  FINAL_CYCLONEDX="${OUTPUT_DIR}/sbom.cyclonedx.xml"
fi
if [[ "${CYCLONEDX_RESULT}" != "${FINAL_CYCLONEDX}" ]]; then
  mv "${CYCLONEDX_RESULT}" "${FINAL_CYCLONEDX}"
fi

echo "SBOM (SPDX): ${FINAL_SPDX}"
echo "SBOM (CycloneDX): ${FINAL_CYCLONEDX}"
echo "Completed ORT analyze/scan/report for ${TARGET_PATH}"
