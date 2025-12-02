# Quickstart: Inno Setup Installer SBOM Extraction

## Prerequisites
- Node.js 18+
- `innounp` (>=0.50) available on PATH; optional `innoextract` (>=1.9) as fallback
- Repository dependencies installed (`npm ci`)

## Run a scan
```bash
npm run build
node dist/cli/inno-sbom.js \
  --installer /abs/path/to/Setup.exe \
  --output-dir ./out/inno-sbom \
  --formats spdx,cyclonedx \
  --log-level info \
  --offline
```

## Outputs
- SBOM files: `sbom.spdx.json` (SPDX 2.3) and `sbom.cyclonedx.json` (CycloneDX 1.6) with identical file coverage.
- Structured log: `scan.log` with extraction/classification events and error codes.
- Status JSON: `scan-status.json` with fields `{ status, coverage, errors, sbom: { spdxPath, cyclonedxPath } }`.

## Exit behavior
- Exit 0 when extraction, classification, and both SBOM emits succeed with full coverage.
- Exit non-zero with actionable error message when extraction fails (e.g., unsupported compression, truncated archive) or when files remain unclassified; `scan-status.json` details the failure.
