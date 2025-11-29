# Implementation Plan: Automated ORT + Fossology Compliance Scanner

**Branch**: `001-ort-fossology-compliance` | **Date**: 2025-11-29 | **Spec**: /Users/chenwensheng/Documents/Codes/bollinmore/ort-foss-sbom/specs/001-ort-fossology-compliance/spec.md
**Input**: Feature specification from `/specs/001-ort-fossology-compliance/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Automate offline-compatible compliance scanning for local projects by orchestrating ORT analysis/scan, SPDX SBOM generation, upload to Fossology, and merged reporting. Deliver a single CLI/CI entrypoint with deterministic tests/fixtures, structured logs, and strict license policy enforcement (fail on incompatible or unknown licenses) within <15m p95 runtime.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Node.js 18+, TypeScript (strict)  
**Primary Dependencies**: ORT CLI, Fossology REST API, Docker, HTTP client (e.g., fetch/axios)  
**Storage**: Local filesystem artifacts (SBOM, reports); no database  
**Testing**: Jest/TS-based unit + integration + contract tests with offline fixtures  
**Target Platform**: Linux containers and CI runners (Docker Compose local)  
**Project Type**: Single CLI/API service  
**Performance Goals**: <15m p95 end-to-end scan for representative repo; status responses within 30s  
**Constraints**: Offline-safe by default (downloader disabled), deterministic outputs, memory capped for large artifacts, non-interactive CLI/JSON UX  
**Scale/Scope**: Typical local repos; artifact sizes may be large due to SBOM/SPDX but streamed/capped  
**Performance Measurement**: CI E2E fixture job measures total runtime; enforce <15m p95 and resource caps via streaming.  
**Security/Redaction**: Logs and reports must redact secrets/paths; downloader remains disabled in production runs; fixture update process documented.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Code Quality & Maintainability: strict TS, lint/format gates, minimal dependencies, module boundaries per pipeline component. ✔
- Testing Standards & Determinism: unit + integration + contract tests with recorded fixtures; golden outputs for SBOM/licensing; offline-only test mode. ✔
- User Experience Consistency: stable CLI/flags/JSON, structured logs, actionable errors, migration notes for any breaking UX. ✔
- Performance & Reliability: <15m p95 target measured in CI, downloader disabled, streaming artifacts/caps, timeouts/retries/backoff for external calls. ✔

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/
```

**Structure Decision**: Single-service project with CLI/API orchestration; docs and contracts under `specs/001-ort-fossology-compliance/`, code under `src/` and tests under `tests/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
