# SBOM Requirements Checklist: Inno Setup Installer SBOM Extraction

**Purpose**: PR-review gate to validate requirement quality for SBOM completeness and license evidence coverage.  
**Created**: 2025-12-02  
**Feature**: specs/002-shortname-inno-setup-sbom/spec.md

## Requirement Completeness

- [x] CHK001 Are requirements explicit that 100% of extracted files must appear in the SBOM with unique paths and checksums? [Completeness, Spec 禮FR-002, Spec 禮SC-001]
- [x] CHK002 Are license evidence sources (README, License files, resource metadata) enumerated with expectations for linking to files? [Completeness, Spec 禮FR-004]
- [x] CHK003 Are requirements documenting architecture and language annotations for all files, including multi-arch/multi-lang payloads? [Completeness, Spec 禮FR-010, Spec 禮Edge Cases]
- [x] CHK004 Are unsupported extraction scenarios (password-protected, uncommon compression, multi-archive) explicitly required to be reported with affected files/segments? [Completeness, Spec 禮FR-006, Spec 禮Edge Cases]
- [x] CHK005 Are logging/auditability requirements covering extraction decisions, classification gaps, and evidence references? [Completeness, Spec 禮FR-008]

## Requirement Clarity

- [x] CHK006 Is ?dentical coverage??between SPDX 2.3 and CycloneDX JSON defined so that both formats contain the same file set and metadata fields? [Clarity, Spec 禮FR-012]
- [x] CHK007 Are terms like ?icense classification??and ?vidence??defined with expected outputs (e.g., SPDX expressions, evidence references)? [Clarity, Spec 禮FR-004, Spec 禮FR-005]
- [x] CHK008 Is ?eterministic workspace??explained (e.g., stable paths, no content mutation) to avoid ambiguity in extraction outputs? [Clarity, Spec 禮FR-001]
- [x] CHK009 Are ?ctionable error details??for CI failures described with required fields (e.g., file/segment identifiers)? [Clarity, Spec 禮FR-006, Spec 禮FR-007]

## Requirement Consistency

- [x] CHK010 Do SBOM content requirements (file path, checksum, type, license, metadata) align consistently across FR-002, FR-003, FR-004, and FR-005 without omissions or conflicts? [Consistency, Spec 禮FR-002?R-005]
- [x] CHK011 Do success criteria (SC-001, SC-002) align with functional requirements for coverage and license classification thresholds? [Consistency, Spec 禮SC-001, Spec 禮SC-002]
- [x] CHK012 Are offline assumptions (FR-009) consistent with logging and evidence requirements that might otherwise imply remote lookups? [Consistency, Spec 禮FR-004, Spec 禮FR-008, Spec 禮FR-009]

## Acceptance Criteria Quality

- [x] CHK013 Are measurable acceptance criteria defined for license classification coverage (e.g., ??5% classified, remaining flagged)? [Acceptance Criteria, Spec 禮SC-002]
- [x] CHK014 Are performance/runtimes quantified for SBOM generation in the context of file-level coverage (??5m p95 for ?? GB)? [Acceptance Criteria, Spec 禮SC-003]
- [x] CHK015 Is there an acceptance criterion confirming traceability from each SBOM entry to its evidence/log references? [Acceptance Criteria, Spec 禮SC-005, Spec 禮FR-008]

## Scenario Coverage

- [x] CHK016 Are requirements covering both success and failure outcomes for extraction, classification, and SBOM emission, including how each is reported to CI users? [Coverage, Spec 禮FR-006, Spec 禮FR-007]
- [x] CHK017 Are scenarios for unexpected extra files (supply-chain risk) included with expectations on how they appear in SBOM outputs? [Coverage, Spec 禮User Story 2]
- [x] CHK018 Are scenarios for installers with both 32-bit and 64-bit payloads or multiple languages fully specified for SBOM representation? [Coverage, Spec 禮FR-010, Spec 禮Edge Cases]

## Edge Case Coverage

- [x] CHK019 Are corrupted/truncated/password-protected installers required to produce explicit SBOM/scan failure outputs rather than partial results? [Edge Case, Spec 禮Edge Cases, Spec 禮FR-006]
- [x] CHK020 Are duplicate filenames across different install paths addressed with guidance to keep distinct SBOM entries and metadata? [Edge Case, Spec 禮Edge Cases]
- [x] CHK021 Is missing or non-text license evidence covered with fallback heuristics and manual-review flags? [Edge Case, Spec 禮Edge Cases, Spec 禮FR-011]

## Non-Functional Requirements

- [x] CHK022 Are determinism expectations documented for SBOM ordering, checksums, and evidence references to ensure repeatable outputs? [Non-Functional, Spec 禮SC-001, Spec 禮FR-005]
- [x] CHK023 Are runtime and resource bounds stated for extraction/classification so CI pipelines can plan budgets? [Non-Functional, Spec 禮SC-003]
- [x] CHK024 Are audit logging requirements specific enough to satisfy compliance reviews (e.g., inputs, decisions, gaps)? [Non-Functional, Spec 禮FR-008, Spec 禮SC-005]

## Dependencies & Assumptions

- [x] CHK025 Are external tool dependencies (innounp/innoextract) and their version/support assumptions captured as requirements? [Dependency, Spec 禮Assumptions]
- [x] CHK026 Are assumptions about installer format (not obfuscated/password-protected) explicitly tied to failure behaviors and user guidance? [Assumption, Spec 禮Assumptions, Spec 禮FR-006]
- [x] CHK027 Is offline operation (no network) clearly framed with any exceptions (e.g., optional uploads) ruled in or out for this feature? [Assumption, Spec 禮FR-009]

## Ambiguities & Conflicts

- [x] CHK028 Is any potential conflict between ?ail fast??behavior and ?etain evidence/logs??resolved in requirements (e.g., what persists on failure)? [Conflict, Spec 禮FR-006, Spec 禮FR-008]
- [x] CHK029 Are criteria for marking files ?anual review required??unambiguously defined (confidence threshold, missing evidence)? [Ambiguity, Spec 禮FR-011]
- [x] CHK030 Is there a defined approach for handling unsupported compression while preserving traceability (e.g., partial listings vs. hard fail)? [Ambiguity, Spec 禮FR-006, Spec 禮SC-004]

