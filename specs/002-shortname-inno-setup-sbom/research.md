# Research: Inno Setup Installer SBOM Extraction

## Unknowns Resolved

### Inno Setup unpacker selection
- Decision: Use `innounp` (>=0.50) as the primary extractor with `innoextract` (>=1.9) as a fallback when signatures or compression methods are unsupported by `innounp`; wrap both behind a single extractor interface with explicit error reporting.
- Rationale: `innounp` supports modern Inno Setup versions and preserves original install paths; `innoextract` has better failure modes on uncommon compression and provides metadata on slices, improving compatibility and diagnostics.
- Alternatives considered: InnoExtractor GUI (not scriptable/CI friendly), custom PE/IS extraction (too complex and error-prone versus mature tools), shipping only one extractor (reduces compatibility across installer variants).

### SBOM serialization approach
- Decision: Generate CycloneDX 1.6 via `@cyclonedx/cyclonedx-library` and emit SPDX 2.3 JSON with a lightweight internal emitter validated against the official JSON schema using AJV during tests.
- Rationale: The CycloneDX library is maintained and reduces schema drift risk; SPDX lacks a mature TypeScript emitter, so a small in-repo builder keeps dependencies lean while still enforcing correctness via schema validation.
- Alternatives considered: Full-featured generators like `cdxgen`/`spdx-sbom-generator` (heavy, pull in broad dependency trees, and harder to keep deterministic), fully custom emitters for both formats (higher risk of spec drift without library support).

### Fixture set for integration tests
- Decision: Maintain a deterministic fixture set: (1) simple installer with README/License, (2) multi-arch or multi-language payload installer, (3) binary-rich installer with PE version info, (4) corrupted/truncated installer, and (5) unsupported compression/sample with split volumes. Size cap <5 MB each; store checksums and expected SBOM snapshots for determinism.
- Rationale: Covers success path, metadata extraction, architecture/language distinctions, and error handling for corruption/unsupported cases while keeping tests fast and offline.
- Alternatives considered: Using large real-world installers (slow, brittle, potential licensing issues) or a single synthetic sample (insufficient coverage of edge cases and failure paths).

## Best Practices by Dependency/Integration

- ORT CLI: Pin ORT version; run with deterministic config and cached rule sets; avoid network downloads; record analyzer/scan logs for auditability.
- Fossology REST client: Keep calls optional/offline for this feature; when used, enforce timeouts/retries, redact tokens in logs, and cover with mocked fixtures.
- Inno Setup unpackers: Ship/pin binary versions, verify availability before scan, run with flags that preserve paths and timestamps, detect multi-volume slices, and surface unsupported compression with actionable errors.
- SBOM emitters: Use stable component/file identifiers, include checksums and evidence references, validate outputs against CycloneDX 1.6 and SPDX 2.3 schemas in tests, and keep serializers deterministic (sorted lists).
- CLI UX: Provide consistent flags for input installer, output directory, formats, and log level; emit machine-readable status plus human-readable summary; fail fast with clear error codes on extraction/validation issues.
