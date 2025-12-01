# Automated ORT + Fossology Compliance Scanner

Node.js 18+ TypeScript toolchain that runs OSS Review Toolkit (ORT) with downloader disabled, merges Fossology license findings, and emits SBOM + consolidated compliance reports for CI/CD.

## Features
- Single non-interactive CLI: analyze, scan, package, and upload from a local path with downloader disabled by default.
- Deterministic offline fixtures for tests; live mode uses ORT CLI + Fossology API.
- Stage-scoped JSON logs with job ids; exits non-zero on license risk/unknowns.
- Artifacts per job under `./out/job-<id>/` (SBOM, merged reports).

## Prerequisites
- Node.js 18+ and npm.
- Optional: ORT CLI available on PATH or via Docker (`bin/ort-docker.sh`).
- For live mode: running Fossology API and ORT CLI (Docker Compose included).

## Quickstart (fixture/offline)
1) Install deps and build:  
```bash
npm install
npm run build
```
2) Run a scan against a local project (downloader disabled):  
```bash
npm run scan /absolute/path/to/project
```
3) Outputs land in `./out/job-<timestamp>/`:
- `report.html`, `report.json`
- `sbom.spdx.json` (and CycloneDX JSON/XML if produced)
- ORT intermediates under `./out/job-<timestamp>/ort/`

`SIMULATE_RISK=1` forces a risk exit for CI gating tests.

## CLI flags & env
- CLI (via `npm run scan`): `scan --path <abs> --config <file?> --downloader-enabled=false (default) --output <dir> (default ./out)`
- Verbose ORT streaming: `npm run scan -- -v /abs/path`
- ORT logging: `ORT_LOG_LEVEL=info|debug` (`ORT_STACKTRACE=1` to include stacktraces)
- Integration mode: `INTEGRATION_MODE=fixture|live` (defaults to `fixture`)
- ORT CLI path: `ORT_CLI_PATH=/path/to/ort` (defaults to Docker wrapper)
- Output base dir: `OUTPUT_DIR=/custom/out` (jobs still use `job-<id>/ort` inside)

## Live mode (+ .env)
1) Copy `.env.sample` → `.env` and set:
   - `INTEGRATION_MODE=live`
   - `FOSSOLOGY_MODE=live`, `FOSSOLOGY_API_URL`, `FOSSOLOGY_TOKEN`
   - Optional: `OUTPUT_DIR`, `FOSSOLOGY_POLL_SECONDS`, `MAX_ARTIFACT_SIZE_BYTES`, `ORT_CLI_PATH`, `ORT_LOG_LEVEL`
2) Start local stack (optional):  
```bash
docker-compose up -d fossology ort
```
3) Run with env auto-loaded (uses `bin/ort-docker.sh` by default):  
```bash
./scripts/scan-live.sh /absolute/path/to/project
```
Artifacts go to `./out/job-<timestamp>/`.

## CI guidance
- Run the same scan command with downloader disabled.
- Fail the job within 1 minute if licenses are unknown/incompatible; exit code 1 with merged report.
- Publish artifacts: `./out/<jobId>/report.html`, `report.json`, `sbom.spdx.json`; include status polling (≤30s freshness) and logs with `jobId`, `stage`, `event`, `code`.
- Measure runtime against the <15m p95 target on the representative fixture repo.

## Fossology upload only (existing ORT output)
Use the scan result SPDX (not analyzer output), e.g. `.../ort/scan-result.spdx.json`.
```bash
export FOSSOLOGY_API_URL=http://localhost:8081/repo
export FOSSOLOGY_TOKEN=<token>
node scripts/test-fossology-upload.js /abs/path/to/ort/scan-result.spdx.json
```

## Troubleshooting
- Missing `.env` in live mode → copy `.env.sample` and fill required variables.
- Downloader must stay disabled; CI should block if `downloaderEnabled=true`.
- Large artifacts (>500MB) are rejected with `ARTIFACT_TOO_LARGE`.

