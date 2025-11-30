# Quickstart: Automated ORT + Fossology Compliance Scanner

1. **Run local scan**  
   ```bash
   npm run scan /path/to/project
   ```  
   Generates `report.html` and SPDX artifacts in the output directory.

2. **Validate outputs**  
   - SBOM package count > 0  
   - Fossology license count > 0  
   - Logs show downloader disabled and no remote fetches

3. **CI requirements**  
- Execute the scan command in CI with project path and credentials; downloader remains disabled.  
- CI job MUST fail within 1 minute if licenses are incompatible or unknown; exit code 1 and merged report artifacts must be published.  
- Runtime MUST be measured against the <15m p95 target on the representative fixture repo.  
- Publish artifacts: `./out/<jobId>/report.html`, `report.json`, `sbom.spdx.json` for downstream review. Include status polling (≤30s freshness) and logs with stage + jobId + event + code.

4. **Flags & defaults**  
- CLI: `scan --path <abs> --config <file?> --downloader-enabled=false (default) --output <dir> (default ./out)`  
- SIMULATE_RISK=1 (test-only) forces risk exit for CI gating validation.

5. **Fixture refresh & downloader enforcement**  
- Fixture refresh: update `tests/fixtures/analyzer.json`, `scanner.spdx.json`, and `fossology-status.json` when upstream tools change; keep copies under version control for deterministic tests.  
- Downloader enforcement: ensure `downloaderEnabled` stays false in all environments; CI must block if set true.  
- Secrets: provide credentials via env/CI secrets; never log or return secret values.

## Real environment setup (ORT + Fossology)

1. **Env file**: copy `.env.sample` to `.env` and set:
   - `INTEGRATION_MODE=live`
   - `ORT_CLI_PATH` (if not on PATH)
   - `FOSSOLOGY_MODE=live`, `FOSSOLOGY_API_URL`, `FOSSOLOGY_TOKEN`
   - Optional: `OUTPUT_DIR`, `FOSSOLOGY_POLL_SECONDS`, `MAX_ARTIFACT_SIZE_BYTES`

2. **Docker Compose (local stack)**  
   ```
   docker-compose up -d fossology ort
   ```
   - Fossology UI/API: http://localhost:8081 (credentials in compose env)
   - ORT CLI image: `ghcr.io/oss-review-toolkit/ort:latest`
   - On Mac ARM/Apple Silicon: images are pinned to `platform: linux/amd64` in compose; enable Docker Desktop Rosetta/QEMU for emulation.

3. **Install ORT CLI locally (alternative to container)**  
   - Follow ORT docs to download the binary/JAR.  
   - Export `ORT_CLI_PATH=/path/to/ort` or place on PATH.

4. **Run live scan**  
   ```
   INTEGRATION_MODE=live \
   FOSSOLOGY_MODE=live \
   FOSSOLOGY_API_URL=http://localhost:8081 \
   FOSSOLOGY_TOKEN=<token> \
   npm run scan /absolute/path/to/project
   ```
   Outputs real ORT/Fossology artifacts under `./out/<jobId>/`.
