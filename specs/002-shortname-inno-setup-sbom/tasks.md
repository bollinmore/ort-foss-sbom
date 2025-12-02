# Tasks: Inno Setup Installer SBOM Extraction

**Input**: Design documents from `/specs/002-shortname-inno-setup-sbom/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/  
**Tests**: Testing tasks are REQUIRED; include unit + integration/contract coverage with deterministic fixtures to satisfy constitution testing standards.  
**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Include explicit tasks for CLI/JSON UX updates and performance/runtime validation when relevant.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)  
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)  
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Update `package.json` to add `@cyclonedx/cyclonedx-library`, `ajv`, and `ajv-formats` dependencies for SBOM emission/validation.  
- [ ] T002 Add npm scripts to build/emit SPDX/CycloneDX for Inno Setup CLI in `package.json` (e.g., `inno-sbom`, `validate:sbom`).  
- [ ] T003 [P] Ensure TypeScript strict config supports new modules; adjust `tsconfig.json` paths/includes for new CLI and services.  
- [ ] T004 [P] Create directories for extractor/classifier/emitters: `src/services/inno/`, `src/lib/sbom/`, `src/models/inno/`.  
- [ ] T005 Configure Jest to include new fixtures and increase timeout for installer extraction tests in `jest.config.cjs`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [ ] T006 Implement shared Inno Setup domain types (InstallerPackage, ExtractionWorkspace, ExtractedFile, LicenseEvidence, SBOMEntry, ScanReport) in `src/models/inno/types.ts`.  
- [ ] T007 [P] Add deterministic checksum and path utilities for extracted files in `src/lib/sbom/file-utils.ts`.  
- [ ] T008 [P] Implement structured logging helper with stages (extracting, classifying, sbom_emitting) in `src/lib/logger.ts`.  
- [ ] T009 Define extractor interface (supports innounp/innoextract, streaming outputs, error mapping) in `src/services/inno/extractor.ts`.  
- [ ] T010 Establish fixtures layout with placeholder installers (simple, multi-arch/lang, metadata-rich, corrupted, unsupported) in `tests/fixtures/inno/README.md` and placeholder files.  
- [ ] T011 Configure AJV schema validators for SPDX 2.3 and CycloneDX 1.6 in `src/lib/sbom/validators.ts`.  
- [ ] T012 Wire CLI entrypoint scaffold `src/cli/inno-sbom.ts` with argument parsing stubs and offline/default flags.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Compliance audit SBOM (Priority: P1) — MVP

**Goal**: Produce complete file-level SBOM with license attribution for all extracted files.  
**Independent Test**: Running scan on simple installer fixture yields SBOM covering 100% files with license evidence links (SPDX and CycloneDX identical coverage).

### Tests for User Story 1

- [ ] T013 [P] [US1] Add integration test for simple installer fixture verifying 100% file coverage and evidence links in `tests/integration/inno-sbom-compliance.spec.ts`.  
- [ ] T014 [P] [US1] Add golden SBOM fixtures (SPDX, CycloneDX) for simple installer in `tests/fixtures/inno/simple/sbom.spdx.json` and `sbom.cyclonedx.json`.  
- [ ] T015 [P] [US1] Add unit test for license evidence extraction heuristics in `tests/unit/inno/license-evidence.spec.ts`.

### Implementation for User Story 1

- [ ] T016 [P] [US1] Implement innounp/innoextract command runners with deterministic workspace handling in `src/services/inno/extractor-innounp.ts` and `src/services/inno/extractor-innoextract.ts`.  
- [ ] T017 [US1] Implement extractor orchestration (select primary/fallback, map errors) in `src/services/inno/extraction-runner.ts`.  
- [ ] T018 [P] [US1] Implement file enumeration/classification (type, checksum, installPath) in `src/services/inno/classifier.ts`.  
- [ ] T019 [P] [US1] Implement license evidence collector (README/License/resource metadata hooks) in `src/services/inno/license-evidence.ts`.  
- [ ] T020 [US1] Implement SPDX 2.3 file-level emitter with AJV validation in `src/lib/sbom/spdx-emitter.ts`.  
- [ ] T021 [US1] Implement CycloneDX 1.6 emitter using `@cyclonedx/cyclonedx-library` in `src/lib/sbom/cyclonedx-emitter.ts`.  
- [ ] T022 [US1] Integrate emitters into CLI flow and ensure identical coverage between formats in `src/cli/inno-sbom.ts`.  
- [ ] T023 [US1] Add structured logging for extraction/classification/evidence in `src/cli/inno-sbom.ts` using `src/lib/logger.ts`.  
- [ ] T024 [US1] Add scan-status JSON output (status, coverage, sbom paths, errors) in `src/cli/inno-sbom.ts`.

**Checkpoint**: User Story 1 fully functional and testable independently

---

## Phase 4: User Story 2 - Supply chain risk review (Priority: P2)

**Goal**: Enumerate binaries/resources with metadata, detect unexpected files, preserve arch/lang distinctions.  
**Independent Test**: Scanning metadata-rich and multi-arch/lang fixtures yields SBOM entries with version/resource info; unexpected files appear with paths for allowlist comparison.

### Tests for User Story 2

- [ ] T025 [P] [US2] Add integration test for metadata-rich installer verifying PE metadata captured per file in `tests/integration/inno-sbom-metadata.spec.ts`.  
- [ ] T026 [P] [US2] Add integration test for multi-arch/lang installer asserting architecture/language annotations preserved in SBOM in `tests/integration/inno-sbom-arch-lang.spec.ts`.  
- [ ] T027 [P] [US2] Add unit test for classification of unexpected/extra files to ensure SBOM inclusion in `tests/unit/inno/classifier-extra.spec.ts`.

### Implementation for User Story 2

- [ ] T028 [P] [US2] Extend classifier to capture PE version/resource metadata and architecture/language hints in `src/services/inno/classifier.ts`.  
- [ ] T029 [US2] Add metadata fields to SBOM entries and evidence references in `src/lib/sbom/spdx-emitter.ts` and `src/lib/sbom/cyclonedx-emitter.ts`.  
- [ ] T030 [US2] Implement detection and reporting for unexpected files (no prior manifest) in `src/services/inno/classifier.ts` with logging hooks.  
- [ ] T031 [US2] Update ScanReport coverage metrics to include metadata completeness in `src/models/inno/types.ts` and `src/cli/inno-sbom.ts`.  
- [ ] T032 [US2] Add documentation for metadata expectations and allowlist comparison in `specs/002-shortname-inno-setup-sbom/quickstart.md`.

**Checkpoint**: User Story 2 functional with independent tests

---

## Phase 5: User Story 3 - CI pipeline automation (Priority: P3)

**Goal**: Provide machine-readable pass/fail, actionable errors, and artifact paths for CI gating.  
**Independent Test**: CI fixture run fails fast on corrupted/unsupported installers with error details; succeeds when SBOM complete; exit codes align with contract.

### Tests for User Story 3

- [ ] T033 [P] [US3] Add integration test for corrupted installer asserting explicit failure code and error detail in `tests/integration/inno-sbom-corrupted.spec.ts`.  
- [ ] T034 [P] [US3] Add integration test for unsupported compression/multi-volume missing segment with fail-fast behavior in `tests/integration/inno-sbom-unsupported.spec.ts`.  
- [ ] T035 [P] [US3] Add contract test for CLI exit codes/status JSON in `tests/contract/inno-sbom-cli.spec.ts`.

### Implementation for User Story 3

- [ ] T036 [US3] Implement exit code mapping and fail-fast logic per contract in `src/cli/inno-sbom.ts`.  
- [ ] T037 [P] [US3] Add timeout handling and graceful cancellation for extractor processes in `src/services/inno/extraction-runner.ts`.  
- [ ] T038 [US3] Ensure scan-status JSON includes actionable errors and coverage thresholds in `src/cli/inno-sbom.ts`.  
- [ ] T039 [US3] Add structured logging correlation IDs for CI traceability in `src/lib/logger.ts`.  
- [ ] T040 [US3] Update quickstart with CI usage examples and exit code table in `specs/002-shortname-inno-setup-sbom/quickstart.md`.

**Checkpoint**: All user stories independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T041 [P] Add performance/runtime budget validation script for 1 GB installer profile in `scripts/validate-inno-runtime.sh`.  
- [ ] T042 Refine documentation: link SBOM schema validation steps and fixture checks in `README.md` and `specs/002-shortname-inno-setup-sbom/quickstart.md`.  
- [ ] T043 [P] Add additional unit tests for edge cases (duplicate filenames, manual-review flags) in `tests/unit/inno/edge-cases.spec.ts`.  
- [ ] T044 Run constitution checks: lint, format, tests, and update plan constitution status if changes occur in `specs/002-shortname-inno-setup-sbom/plan.md`.  
- [ ] T045 [P] Add sample logs/status outputs to fixtures for documentation in `tests/fixtures/inno/logs/`.

---

## Dependencies & Execution Order

- Setup (Phase 1) → Foundational (Phase 2) → US1 (Phase 3) → US2 (Phase 4) → US3 (Phase 5) → Polish (Phase 6).  
- User Story Dependencies: US1 provides extraction/classification/SBOM core; US2 builds on classification metadata and SBOM enrichment; US3 relies on US1/US2 outputs for CI gating.  
- Within each story: tests should be authored before implementation tasks; classifier updates precede emitter/CLI wiring when dependent.

## Parallel Execution Examples

- Setup: T003–T004 can run in parallel after T001–T002 start; T005 can proceed independently once dependencies known.  
- US1: Tests T013–T015 in parallel; implementations T016/T018/T019 in parallel, then T017/T020–T024 serial where outputs depend on emitters.  
- US2: Tests T025–T027 in parallel; T028 and T030 parallel; T029 follows T028; T031 depends on classifier outputs; T032 independent.  
- US3: Tests T033–T035 in parallel; T037 parallel to T036 after runner ready; T038 depends on T036; T039 independent; T040 independent.

## Implementation Strategy

- **MVP (User Story 1 only)**: Complete Phases 1–3; validate SBOM completeness and evidence on simple fixture before proceeding.  
- **Incremental Delivery**: Add US2 for metadata/risk coverage; add US3 for CI gating. Each story remains independently testable with its fixtures and exit codes.  
- **Validation**: Ensure all tasks maintain deterministic, offline-safe behavior and update fixtures/goldens when schema or classifier changes.
