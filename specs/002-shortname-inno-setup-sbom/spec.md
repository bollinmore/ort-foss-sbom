# Feature Specification: Inno Setup Installer SBOM Extraction

**Feature Branch**: `002-shortname-inno-setup-sbom`  
**Created**: 2025-12-02  
**Status**: Draft  
**Input**: User description: "增加另一種掃描目標 - 採用 Inno Setup 打包的安裝檔，具體需求是要詳細描述安裝在系統中的每個實體檔案，包括來自安裝包的資源、配置、以及各檔案的授權和類型資訊。因此，需要一套工具能自動解析 Inno Setup 安裝檔（Setup.exe），並將其內部包含的所有檔案完整還原，並根據檔案名稱、描述資源、二進制元資料（如版本資訊、資源描述）和 README/License 檔案等判斷每個檔案的屬性和授權狀況。 此方案的核心目的是：產生一份詳細的 SBOM，反映每一個安裝到用戶端的實體檔案的資訊，支持針對 Windows 安裝程式的供應鏈安全、法律遵從與資產管理。"

**Cross-Cutting Obligations**: Keep CLI/API UX stable, stay within typical scan runtime budgets (target <15m p95 for standard scans), maintain strict TypeScript quality, and ship deterministic tests/fixtures.

## Clarifications

### Session 2025-12-02

- Q: Which SBOM formats should the tool emit for file-level coverage? → A: Emit both SPDX 2.3 and CycloneDX (JSON) with identical coverage.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Compliance audit SBOM (Priority: P1)

Compliance officer runs an Inno Setup installer through the scanning tool to obtain a full file-level SBOM with license attribution for legal review.

**Why this priority**: Enables legal sign-off for distributing the installer; critical path for release gating.

**Independent Test**: Provide a representative Inno Setup installer and verify the tool outputs a complete SBOM with per-file license classifications consumable by the audit process.

**Acceptance Scenarios**:

1. **Given** an unsigned Inno Setup installer, **When** the user triggers a scan, **Then** the tool produces an SBOM covering 100% of extracted files with license labels and file types.
2. **Given** an installer containing embedded README/License files, **When** the scan completes, **Then** those files are linked to the corresponding file entries as license evidence in the SBOM.

---

### User Story 2 - Supply chain risk review (Priority: P2)

Security analyst reviews Windows installer contents to detect unexpected binaries/resources and confirm provenance before deployment.

**Why this priority**: Reduces risk of shipping tampered or unapproved components in the Windows supply chain.

**Independent Test**: Scan an installer with known binary metadata and verify the output enumerates every installed binary with version/resource info and flags any missing metadata.

**Acceptance Scenarios**:

1. **Given** an installer with executables and DLLs, **When** a scan is run, **Then** the SBOM lists each binary with version info, resource descriptions, and classification (binary/script/resource).
2. **Given** the installer contains unexpected extra files, **When** the scan is reviewed, **Then** those files appear in the SBOM so the analyst can compare against an allowlist.

---

### User Story 3 - CI pipeline automation (Priority: P3)

Release engineer adds automated scanning of Inno Setup installers in CI to block releases lacking complete SBOM coverage.

**Why this priority**: Prevents incomplete compliance artifacts from being shipped; supports automated gating.

**Independent Test**: Run the scan as a CI step on a sample installer and ensure the pipeline receives a pass/fail status and machine-readable SBOM output.

**Acceptance Scenarios**:

1. **Given** CI receives a new installer artifact, **When** the scan step executes, **Then** it exits with success only if SBOM generation completes and coverage thresholds are met.
2. **Given** extraction fails or files cannot be classified, **When** CI runs the scan, **Then** the pipeline fails with actionable error detail identifying the problematic files.

---

### Edge Cases

- Installer is corrupted, truncated, or password-protected; scan must fail clearly and report inability to extract.
- Installer uses uncommon Inno Setup compression or multi-archive segments; scan should detect and report unsupported formats without silent data loss.
- Installer includes both 32-bit and 64-bit payloads or multiple language components; output must retain architecture/language distinctions per file.
- Embedded license/readme content is missing or non-text; scan should note absent evidence while still classifying files via metadata heuristics.
- Files with duplicate names across different install paths; SBOM must keep distinct paths and metadata per instance.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST ingest an Inno Setup installer (`Setup.exe`) and extract all contained files to a deterministic workspace without altering contents.
- **FR-002**: System MUST enumerate every installed file with original install path, size, checksum, and classification (e.g., binary, library, script, resource, config, documentation).
- **FR-003**: System MUST capture binary metadata when present (e.g., version, product/company name, file description) and associate it with the corresponding file entry.
- **FR-004**: System MUST detect and associate license evidence from README/License files and resource metadata to classify each file's license status; outputs MUST include SPDX expression and `evidenceIds` referencing source artifacts (README, License, resource strings, binary metadata).
- **FR-005**: System MUST generate a file-level SBOM that includes for each file: path, checksum, file type classification, license determination (SPDX expression), `classificationStatus` (`classified` or `manual_review_required`), and `evidenceIds` references.
- **FR-006**: System MUST surface unsupported or partially extracted archives with explicit error messages that identify affected files or segments.
- **FR-007**: System MUST produce machine-readable output suitable for CI gating (success/failure plus SBOM artifact location).
- **FR-008**: System MUST log extraction and classification decisions to support auditability (inputs, decisions, gaps).
- **FR-009**: Users MUST be able to run the scan offline after downloading the installer; process must not require external network calls to complete core extraction and classification.
- **FR-010**: System MUST preserve and report architecture/language distinctions for files when installers contain multi-arch or multi-language payloads.
- **FR-011**: System MUST flag files whose license cannot be confidently determined and mark them for manual review.
- **FR-012**: System MUST emit SBOMs in both SPDX 2.3 and CycloneDX JSON formats with identical file-level coverage.

### Key Entities

- **InstallerPackage**: The Inno Setup installer artifact being scanned; attributes include signature status, compression scheme, and constituent archive segments.
- **ExtractedFile**: A file recovered from the installer; attributes include original install path, size, checksum, type classification, architecture/language context, and binary/resource metadata.
- **LicenseEvidence**: Collected indicators (README/License texts, resource strings, metadata fields) used to infer license classification; linked to one or more ExtractedFile records.
- **SBOMEntry**: Record in the generated SBOM representing a single extracted file with associated metadata, license classification, evidence references, and extraction status.
- **ScanReport**: Summary of the scan run including success/failure, coverage, errors, and pointers to SBOM artifacts for CI or auditors.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of files extracted from supported Inno Setup installers appear in the SBOM with unique paths and checksums.
- **SC-002**: At least 95% of files have a license classification with identified evidence; remaining files are explicitly flagged for manual review.
- **SC-003**: Standard installer scans (up to 1 GB payload) complete within 15 minutes p95 on reference hardware.
- **SC-004**: CI runs fail fast with actionable errors when extraction or classification gaps exist, enabling remediation without rerunning full pipelines.
- **SC-005**: Auditors can trace each SBOM entry to source evidence (metadata or files) sufficient to sign off release compliance.

## Assumptions

- Inno Setup installers are not password-protected or intentionally obfuscated; unsupported cases are reported as failures.
- Internet access may be unavailable during scans; all essential extraction and classification rely on local analysis.
- Provided installers follow standard Inno Setup packaging formats; exotic custom scripts beyond packaging may require follow-up.
