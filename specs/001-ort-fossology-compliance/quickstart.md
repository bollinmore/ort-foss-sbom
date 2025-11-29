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
