---

description: "Task list for Automated ORT + Fossology Compliance Scanner"

---

# Tasks: Automated ORT + Fossology Compliance Scanner

**Input**: Design documents from `/specs/001-ort-fossology-compliance/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Testing tasks are REQUIRED; include unit + integration/contract coverage with deterministic fixtures to satisfy constitution testing standards.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Include explicit tasks for CLI/JSON UX updates and performance/runtime validation when relevant.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Configure strict TypeScript, path aliases, and build output in tsconfig.json
- [ ] T002 Add lint/format/test tooling configs (eslint, prettier, jest) in package.json and config files
- [ ] T003 Create Docker Compose services for ORT CLI, Fossology, and API in docker-compose.yml
- [ ] T004 Add CI workflow skeleton for lint/test/scan dry-run in .github/workflows/ci.yml
- [ ] T028 Add timed E2E fixture run measuring total runtime vs <15m p95 target in .github/workflows/ci.yml (reports duration)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [ ] T005 Implement shared data models (ProjectInput, ScanJob, ComplianceReport) in src/models/
- [ ] T006 Implement structured logger/tracer utilities with stage context in src/lib/logger.ts
- [ ] T007 Implement HTTP client wrapper with retry/backoff/timeout defaults in src/lib/httpClient.ts
- [ ] T008 Prepare offline fixtures (ORT analyzer/scanner outputs, Fossology responses) in tests/fixtures/
- [ ] T029 Implement artifact streaming/capping for SBOM/upload in src/services/workflowOrchestrator.ts with resource limits documented

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Run offline compliance scan from local source (Priority: P1) 🎯 MVP

**Goal**: Single non-interactive command scans local project, generates SPDX SBOM, uploads artifacts without remote downloads.

**Independent Test**: Run command against fixture repo with downloader disabled; SBOM and upload job ID produced without network fetches.

### Tests for User Story 1 ⚠️

- [ ] T009 [P] [US1] Contract test for POST /scan covering valid/invalid path and downloader disabled in tests/contract/scan.spec.ts
- [ ] T010 [US1] Integration test for CLI scan happy-path with fixtures and job ID in tests/integration/scan.cli.spec.ts
- [ ] T030 [P] [US1] Contract test: POST /scan missing/unreadable path returns actionable error code/message in tests/contract/scan.spec.ts
- [ ] T033 [US1] Integration test asserts stage-scoped structured logs and actionable errors during scan in tests/integration/scan.logs.spec.ts

### Implementation for User Story 1

- [ ] T011 [US1] Implement OrtRunner to execute analyze/scan with downloader off in src/services/ortRunner.ts
- [ ] T012 [P] [US1] Implement FossologyClient upload/schedule stubs using HTTP wrapper in src/services/fossologyClient.ts
- [ ] T013 [US1] Implement WorkflowOrchestrator pipeline (analyze → scan → upload → merge hook) in src/services/workflowOrchestrator.ts
- [ ] T014 [P] [US1] Implement CLI entrypoint `scan` command wiring orchestrator, logs, exit codes in src/cli/scan.ts
- [ ] T015 [US1] Add API handler for POST /scan using orchestrator in src/services/api/scanHandler.ts
- [ ] T016 [US1] Implement initial ReportMerger to package SBOM + upload metadata in src/services/reportMerger.ts

**Checkpoint**: User Story 1 independently functional and testable offline

---

## Phase 4: User Story 2 - Monitor scan status and license findings (Priority: P2)

**Goal**: Reviewer can poll job status and view stage progression and timestamps.

**Independent Test**: Poll known job ID through stages using fixtures; responses show stage, progress, and timestamps.

### Tests for User Story 2 ⚠️

- [ ] T017 [P] [US2] Contract test for GET /status/:jobId covering stages/progress/errors in tests/contract/status.spec.ts
- [ ] T031 [P] [US2] Contract test: Fossology unreachable/timeout surfaces retryable status and clear reason in tests/contract/status.spec.ts
- [ ] T036 [US2] Status freshness check: polling/updates meet ≤30s freshness target using fixture job in tests/integration/status.freshness.spec.ts

### Implementation for User Story 2

- [ ] T018 [US2] Implement status handler for GET /status/:jobId exposing stage/progress/timestamps in src/services/api/statusHandler.ts
- [ ] T019 [P] [US2] Implement job state store with stage updates and persistence in src/services/jobStore.ts
- [ ] T020 [US2] Extend workflow to emit stage events and progress updates for status responses in src/services/workflowOrchestrator.ts

**Checkpoint**: User Stories 1 AND 2 independently functional

---

## Phase 5: User Story 3 - Consume consolidated compliance report in CI/CD (Priority: P3)

**Goal**: CI consumes merged report artifact and fails builds on license risks/coverage gaps.

**Independent Test**: Run CI-style flow on fixture repo; job fails on risk thresholds and publishes merged report artifacts.

### Tests for User Story 3 ⚠️

- [ ] T021 [P] [US3] Contract test for GET /report/:jobId returning merged report links and risk summary in tests/contract/report.spec.ts
- [ ] T022 [US3] Integration test for CI exit codes and artifact outputs on risk breach in tests/integration/report.ci.spec.ts
- [ ] T032 [P] [US3] Contract test: unknown/incompatible licenses trigger failure exit + risk summary in tests/contract/report.spec.ts
- [ ] T035 [US3] Integration test: CI run fails within ≤1m of risk detection and publishes merged report artifacts in tests/integration/report.ci.spec.ts
- [ ] T037 [US3] License accuracy sampling task comparing fixtures to expected 95%+ accuracy in tests/integration/license.accuracy.spec.ts

### Implementation for User Story 3

- [ ] T023 [US3] Complete ReportMerger to combine SBOM + Fossology findings with coverage/risk metrics in src/services/reportMerger.ts
- [ ] T024 [P] [US3] Implement GET /report/:jobId handler returning merged report URLs and summaries in src/services/api/reportHandler.ts
- [ ] T025 [US3] Add CI-facing exit code and artifact publishing logic for risk thresholds in src/cli/scan.ts

**Checkpoint**: All user stories independently functional with CI consumption

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T026 Update documentation (quickstart, contracts) to reflect flags, outputs, and CI usage in specs/001-ort-fossology-compliance/
- [ ] T027 Add observability/metrics hooks for key stages and performance budgets in src/lib/logger.ts and src/services/workflowOrchestrator.ts (metrics/alerts scope)
- [ ] T034 Document fixture refresh process and downloader-off enforcement in specs/001-ort-fossology-compliance/quickstart.md
- [ ] T038 Implement and validate log redaction for secrets/paths in src/lib/logger.ts with tests in tests/unit/logger.redaction.spec.ts
- [ ] T039 Add contract test proving API responses/logs do not leak credentials or sensitive paths in tests/contract/security.spec.ts
- [ ] T040 Clarify observability scope separation (T027 metrics/alerts vs T006/T007 logging/http client) in tasks.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies - can start immediately
- Foundational (Phase 2): Depends on Setup completion - BLOCKS all user stories
- User Stories (Phase 3+): All depend on Foundational phase completion; proceed in priority order P1 → P2 → P3
- Polish (Final Phase): Depends on all desired user stories being complete

### User Story Dependencies

- User Story 1 (P1): Can start after Foundational (Phase 2)
- User Story 2 (P2): Depends on ScanJob state emitted by US1 components
- User Story 3 (P3): Depends on reports and status outputs from US1/US2

### Within Each User Story

- Tests are written and fail before implementation tasks
- Models before services
- Services before endpoints/CLI wiring
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- Setup tasks T001–T004 can run in parallel
- Foundational tasks T005–T008 can run in parallel once repo setup is done
- Within US1: T012 and T014 parallel; tests T009 and T010 parallel
- Within US2: T017 and T019 parallel
- Within US3: T021 and T024 parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup  
2. Complete Phase 2: Foundational  
3. Complete Phase 3: User Story 1  
4. STOP and VALIDATE: Test User Story 1 independently  
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready  
2. Add User Story 1 → Test independently → Deploy/Demo (MVP)  
3. Add User Story 2 → Test independently → Deploy/Demo  
4. Add User Story 3 → Test independently → Deploy/Demo  
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together  
2. Once Foundational is done:
   - Developer A: User Story 1  
   - Developer B: User Story 2  
   - Developer C: User Story 3  
3. Stories complete and integrate independently

---
