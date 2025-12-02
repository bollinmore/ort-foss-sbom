# SBOM Requirements Checklist: Inno Setup Installer SBOM Extraction

**Purpose**: PR-review gate to validate requirement quality for SBOM completeness and license evidence coverage.  
**Created**: 2025-12-02  
**Feature**: specs/002-shortname-inno-setup-sbom/spec.md

## Requirement Completeness

- [ ] CHK001 Are requirements explicit that 100% of extracted files must appear in the SBOM with unique paths and checksums? [Completeness, Spec §FR-002, Spec §SC-001]
- [ ] CHK002 Are license evidence sources (README, License files, resource metadata) enumerated with expectations for linking to files? [Completeness, Spec §FR-004]
- [ ] CHK003 Are requirements documenting architecture and language annotations for all files, including multi-arch/multi-lang payloads? [Completeness, Spec §FR-010, Spec §Edge Cases]
- [ ] CHK004 Are unsupported extraction scenarios (password-protected, uncommon compression, multi-archive) explicitly required to be reported with affected files/segments? [Completeness, Spec §FR-006, Spec §Edge Cases]
- [ ] CHK005 Are logging/auditability requirements covering extraction decisions, classification gaps, and evidence references? [Completeness, Spec §FR-008]

## Requirement Clarity

- [ ] CHK006 Is “identical coverage” between SPDX 2.3 and CycloneDX JSON defined so that both formats contain the same file set and metadata fields? [Clarity, Spec §FR-012]
- [ ] CHK007 Are terms like “license classification” and “evidence” defined with expected outputs (e.g., SPDX expressions, evidence references)? [Clarity, Spec §FR-004, Spec §FR-005]
- [ ] CHK008 Is “deterministic workspace” explained (e.g., stable paths, no content mutation) to avoid ambiguity in extraction outputs? [Clarity, Spec §FR-001]
- [ ] CHK009 Are “actionable error details” for CI failures described with required fields (e.g., file/segment identifiers)? [Clarity, Spec §FR-006, Spec §FR-007]

## Requirement Consistency

- [ ] CHK010 Do SBOM content requirements (file path, checksum, type, license, metadata) align consistently across FR-002, FR-003, FR-004, and FR-005 without omissions or conflicts? [Consistency, Spec §FR-002–FR-005]
- [ ] CHK011 Do success criteria (SC-001, SC-002) align with functional requirements for coverage and license classification thresholds? [Consistency, Spec §SC-001, Spec §SC-002]
- [ ] CHK012 Are offline assumptions (FR-009) consistent with logging and evidence requirements that might otherwise imply remote lookups? [Consistency, Spec §FR-004, Spec §FR-008, Spec §FR-009]

## Acceptance Criteria Quality

- [ ] CHK013 Are measurable acceptance criteria defined for license classification coverage (e.g., ≥95% classified, remaining flagged)? [Acceptance Criteria, Spec §SC-002]
- [ ] CHK014 Are performance/runtimes quantified for SBOM generation in the context of file-level coverage (≤15m p95 for ≤1 GB)? [Acceptance Criteria, Spec §SC-003]
- [ ] CHK015 Is there an acceptance criterion confirming traceability from each SBOM entry to its evidence/log references? [Acceptance Criteria, Spec §SC-005, Spec §FR-008]

## Scenario Coverage

- [ ] CHK016 Are requirements covering both success and failure outcomes for extraction, classification, and SBOM emission, including how each is reported to CI users? [Coverage, Spec §FR-006, Spec §FR-007]
- [ ] CHK017 Are scenarios for unexpected extra files (supply-chain risk) included with expectations on how they appear in SBOM outputs? [Coverage, Spec §User Story 2]
- [ ] CHK018 Are scenarios for installers with both 32-bit and 64-bit payloads or multiple languages fully specified for SBOM representation? [Coverage, Spec §FR-010, Spec §Edge Cases]

## Edge Case Coverage

- [ ] CHK019 Are corrupted/truncated/password-protected installers required to produce explicit SBOM/scan failure outputs rather than partial results? [Edge Case, Spec §Edge Cases, Spec §FR-006]
- [ ] CHK020 Are duplicate filenames across different install paths addressed with guidance to keep distinct SBOM entries and metadata? [Edge Case, Spec §Edge Cases]
- [ ] CHK021 Is missing or non-text license evidence covered with fallback heuristics and manual-review flags? [Edge Case, Spec §Edge Cases, Spec §FR-011]

## Non-Functional Requirements

- [ ] CHK022 Are determinism expectations documented for SBOM ordering, checksums, and evidence references to ensure repeatable outputs? [Non-Functional, Spec §SC-001, Spec §FR-005]
- [ ] CHK023 Are runtime and resource bounds stated for extraction/classification so CI pipelines can plan budgets? [Non-Functional, Spec §SC-003]
- [ ] CHK024 Are audit logging requirements specific enough to satisfy compliance reviews (e.g., inputs, decisions, gaps)? [Non-Functional, Spec §FR-008, Spec §SC-005]

## Dependencies & Assumptions

- [ ] CHK025 Are external tool dependencies (innounp/innoextract) and their version/support assumptions captured as requirements? [Dependency, Spec §Assumptions]
- [ ] CHK026 Are assumptions about installer format (not obfuscated/password-protected) explicitly tied to failure behaviors and user guidance? [Assumption, Spec §Assumptions, Spec §FR-006]
- [ ] CHK027 Is offline operation (no network) clearly framed with any exceptions (e.g., optional uploads) ruled in or out for this feature? [Assumption, Spec §FR-009]

## Ambiguities & Conflicts

- [ ] CHK028 Is any potential conflict between “fail fast” behavior and “retain evidence/logs” resolved in requirements (e.g., what persists on failure)? [Conflict, Spec §FR-006, Spec §FR-008]
- [ ] CHK029 Are criteria for marking files “manual review required” unambiguously defined (confidence threshold, missing evidence)? [Ambiguity, Spec §FR-011]
- [ ] CHK030 Is there a defined approach for handling unsupported compression while preserving traceability (e.g., partial listings vs. hard fail)? [Ambiguity, Spec §FR-006, Spec §SC-004]
