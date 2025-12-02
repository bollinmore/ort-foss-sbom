# Data Model: Inno Setup Installer SBOM Extraction

## InstallerPackage
- `sourcePath`: string, absolute path to installer; must exist/readable and be an Inno Setup executable.
- `sizeBytes`: number; >0.
- `checksum`: string (sha256) for reproducibility.
- `signatureStatus`: enum { unsigned, signed, invalid_signature }.
- `compression`: string describing detected compression/segment info.
- `segments`: list of slice descriptors for multi-volume installers.

## ExtractionWorkspace
- `workdir`: string path for deterministic extraction output.
- `extractor`: enum { innounp, innoextract } used for the run.
- `status`: enum { pending, extracting, extracted, failed }.
- `errors`: list of extraction errors with filenames/segments when applicable.

## ExtractedFile
- `id`: string stable identifier.
- `installPath`: string original path inside installer.
- `extractedPath`: string absolute path in workspace.
- `sizeBytes`: number.
- `checksum`: string (sha256).
- `type`: enum { executable, dll, script, resource, config, documentation, other }.
- `architecture`: enum { x86, x64, arm64, unknown }.
- `language`: string or `unknown`.
- `metadata`: object with PE version info (productName, fileDescription, fileVersion, companyName) and resource summaries.
- `status`: enum { ok, unsupported, failed } with message when not ok.

## LicenseEvidence
- `id`: string.
- `sourceFileId`: ExtractedFile.id referencing README/License/resource carrier.
- `evidenceType`: enum { readme, license_file, resource_string, binary_metadata }.
- `snippetHash`: optional string for text hash when applicable.
- `confidence`: number (0-1).
- `summary`: short string of detected license indicators.

## SBOMEntry
- `fileId`: ExtractedFile.id reference.
- `path`: string original install path.
- `checksum`: string.
- `fileType`: mirrors ExtractedFile.type.
- `license`: string SPDX expression or `unknown`.
- `evidenceIds`: list of LicenseEvidence.id linked to the file.
- `metadataRef`: link to ExtractedFile.metadata and status.
- `classificationStatus`: enum { classified, manual_review_required }.

## ScanReport
- `jobId`: string.
- `startedAt` / `completedAt`: ISO timestamps.
- `status`: enum { pending, extracting, classifying, sbom_emitting, failed, completed }.
- `errors`: list of error details (including unsupported compression or unreadable segments).
- `coverage`: percentage of files extracted and classified.
- `sbom`: object with `spdxPath` and `cyclonedxPath` outputs.
- `logs`: path to structured log for auditability.

## Relationships
- InstallerPackage -> ExtractionWorkspace (one-to-one per run).
- ExtractionWorkspace -> ExtractedFile (one-to-many).
- ExtractedFile -> LicenseEvidence (one-to-many).
- ExtractedFile -> SBOMEntry (one-to-one).
- ScanReport aggregates InstallerPackage, ExtractionWorkspace, SBOMEntry set, and LicenseEvidence references.

## Validation/States
- Validate installer existence and type before extraction; reject password-protected or unreadable archives.
- ExtractionWorkspace status transitions: pending -> extracting -> extracted|failed.
- ScanReport status transitions: pending -> extracting -> classifying -> sbom_emitting -> completed|failed with terminal error codes on unsupported formats or missing classifications.
