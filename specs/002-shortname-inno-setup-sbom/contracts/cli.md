# CLI Contract: Inno Setup Installer SBOM Extraction

## Command
`node dist/cli/inno-sbom.js --installer <path> --output-dir <path> [options]`

### Required flags
- `--installer`: Absolute path to Inno Setup installer (`Setup.exe`); must exist and be readable.
- `--output-dir`: Directory for extracted workspace, logs, and SBOM outputs; created if missing.

### Optional flags
- `--formats`: Comma-separated list, default `spdx,cyclonedx`; supported values: `spdx`, `cyclonedx`.
- `--log-level`: `error|warn|info|debug`; default `info`.
- `--offline`: Boolean; when true, disables any network calls (default true).
- `--timeout-seconds`: Overall scan timeout; default 900.
- `--fail-on-unsupported`: Boolean; if true, fail when any file/segment is unsupported (default true).
- `--retain-workspace`: Keep extracted files after completion (default false).

## Outputs
- `sbom.spdx.json`: SPDX 2.3 file-level SBOM (JSON).
- `sbom.cyclonedx.json`: CycloneDX 1.6 file-level SBOM (JSON).
- `scan-status.json`: Machine-readable summary:
```json
{
  "status": "completed",
  "coverage": { "extracted": 100, "classified": 97 },
  "sbom": { "spdxPath": "sbom.spdx.json", "cyclonedxPath": "sbom.cyclonedx.json" },
  "errors": [],
  "extractor": "innounp",
  "timings": { "extractSeconds": 25, "classifySeconds": 12, "emitSeconds": 5 }
}
```
- `scan.log`: Structured log of extraction/classification decisions and errors.

## Exit codes
- `0`: Success; SBOMs written and coverage meets thresholds.
- `2`: Invalid input (missing installer, unreadable path, or unsupported format selection).
- `3`: Extraction failure (unsupported compression, truncated/missing segments, password-protected).
- `4`: Classification gaps (files remain unclassified and `--fail-on-unsupported` is true).
- `5`: SBOM emit/validation failure (schema validation or write error).
- `6`: Timeout reached (`--timeout-seconds`).

## Error contract
- All failures emit to stderr a JSON line:
```json
{
  "error": "EXTRACTION_FAILED",
  "message": "Unsupported compression method: LZMA2-XYZ",
  "details": { "segment": "setup-1.bin" }
}
```
- `scan-status.json` mirrors the error code and message for CI consumption.
