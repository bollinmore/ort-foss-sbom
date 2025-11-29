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
- Publish artifacts: `./out/<jobId>/report.html`, `report.json`, `sbom.spdx.json` for downstream review.
