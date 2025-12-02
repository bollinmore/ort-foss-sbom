# Inno Setup Fixtures

Placeholder fixture layout for Inno Setup SBOM tests. Replace `placeholder.txt` with real installer binaries when available and update golden SBOMs accordingly.

## Scenarios
- `simple/` – minimal installer with README/License files for baseline SBOM and evidence coverage.
- `multi-arch-lang/` – installer containing x86/x64 payloads or multiple languages; used to verify arch/lang annotations.
- `metadata-rich/` – binaries with PE version/resource metadata to exercise classification metadata capture.
- `corrupted/` – truncated or otherwise invalid installer to test fail-fast extraction behavior.
- `unsupported/` – installer using unsupported compression or missing volumes to validate clear error reporting.
- `unexpected/` – installer containing extra/unexpected files to ensure SBOM includes them for allowlist comparison.

Add accompanying golden SBOMs and fixtures when implementation is ready. A real installer (`iq2-setup.exe`, ~411 MB) now lives under `tests/fixtures/inno/iq2-setup.exe` for integration tests; it is ignored by git to avoid bloating the repo.
