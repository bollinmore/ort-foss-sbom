# Data Model: Automated ORT + Fossology Compliance Scanner

## ProjectInput
- `localPath`: string (absolute path to project root) — REQUIRED, must exist/readable.
- `config`: OrtConfig (optional) — downloader enabled flag (default false), include/exclude patterns, scan timeouts.

## ScanJob
- `jobId`: string — unique identifier returned after upload.
- `status`: enum { queued, analyzing, scanning, uploading, license_review, completed, failed }.
- `startedAt` / `completedAt`: ISO timestamps.
- `errors`: list of error messages (optional).
- `artifacts`: references to SBOM/SPDX, logs, merged report.

## OrtScanResult
- `analyzer`: path/reference to analyzer YAML output.
- `scanner`: path/reference to SPDX output from scanner.
- `summary`: counts for components, packages, vulnerabilities (if present).

## FossologyUpload
- `uploadId`: number — Fossology upload identifier.
- `scanResult`: SPDX reference used for upload.
- `status`: enum { scheduled, in_progress, completed, failed }.
- `findings`: optional summary of license counts/flags.

## LicenseAssessment
- `componentId`: stable identifier linking to SBOM entries.
- `licenses`: list of detected licenses with confidence.
- `riskFlags`: list (unknown, incompatible, missing-attribution).

## ComplianceReport
- `sbom`: SPDX document reference.
- `licenses`: list of LicenseAssessment.
- `risks`: Risk[] aggregated (type, severity, affected components).
- `coverage`: percentages for analyzed components vs. total detected.
- `reportUrl`: downloadable artifact link.

## Relationships
- ProjectInput → ScanJob (one-to-many per invocations).
- ScanJob → OrtScanResult (one-to-one).
- ScanJob → FossologyUpload (one-to-one).
- FossologyUpload → LicenseAssessment (one-to-many).
- ComplianceReport aggregates SBOMArtifact/SPDX + LicenseAssessment for a ScanJob.
