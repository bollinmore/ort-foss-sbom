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

3. **CI example**  
   - Execute the scan command in CI with project path and credentials.  
   - Fail the job if license risks are incompatible or unknown.  
   - Publish merged report artifacts for downstream review.
