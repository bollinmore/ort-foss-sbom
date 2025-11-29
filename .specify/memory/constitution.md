<!--
Sync Impact Report:
- Version: N/A -> 1.0.0
- Modified principles: PRINCIPLE_1_NAME -> Code Quality & Maintainability; PRINCIPLE_2_NAME -> Testing Standards & Determinism; PRINCIPLE_3_NAME -> User Experience Consistency; PRINCIPLE_4_NAME -> Performance & Reliability
- Added sections: Compliance & Security Standards; Development Workflow & Quality Gates
- Removed sections: Placeholder fifth principle
- Templates requiring updates: ✅ .specify/templates/plan-template.md; ✅ .specify/templates/spec-template.md; ✅ .specify/templates/tasks-template.md
- Follow-up TODOs: None
-->

# ORT-FOSS SBOM Constitution

## Core Principles

### I. Code Quality & Maintainability
- TypeScript code MUST run in strict mode with clear module boundaries, stable interfaces, and documented invariants for each pipeline step (ORT runner, Fossology client, report merger, workflow orchestration).
- Code MUST remain small and dependency-light: prefer shared utilities over new packages, pin transitive tooling versions that affect scan output, and document any new external dependency and its review.
- Automated linting/formatting and peer review are mandatory gates before merge; non-trivial logic requires inline rationale or references to specs/plans.
Rationale: Compliance automation depends on predictable, reviewable code to keep SBOM and licensing results trustworthy.

### II. Testing Standards & Determinism
- No change merges without tests: unit tests for orchestration logic, integration tests covering end-to-end scan (ORT analyze → scan → Fossology upload) using recorded/fixture data, and contract tests for every public API/CLI surface.
- Tests MUST be deterministic and offline-safe: forbid remote downloads in test runs, isolate network calls with fixtures/mocks, and ensure repeatable seeds and time control.
- Regressions in SBOM content or license classification MUST be caught via golden files or snapshot comparisons with explicit update commands.
Rationale: Deterministic tests are the safety net for a compliance pipeline that cannot tolerate silent drift.

### III. User Experience Consistency
- The CLI/JSON interface MUST stay consistent: stable command names/flags, structured JSON output alongside human-readable summaries, machine-friendly exit codes, and actionable error messages.
- Backward-incompatible UX changes require a migration note, version bump per governance, and deprecation period when feasible; defaults remain non-interactive and scriptable.
- Logging MUST be structured and scoped by stage (analyze, scan, upload, merge) with clear identifiers for traceability.
Rationale: Operators need reliable, automatable UX to integrate the scanner into CI/CD and audits.

### IV. Performance & Reliability
- End-to-end scan (analyze + scan + upload + merge) MUST target <15 minutes p95 for a representative project; plans/specs must declare expected runtime budgets and data volumes.
- Pipelines MUST avoid unnecessary downloads, stream large artifacts, and cap memory; concurrency is allowed only when deterministic and within Fossology/ORT limits.
- Timeouts, retries with backoff, and progress visibility are required for all external calls; failed steps must produce resumable or cleanly restartable states.
Rationale: Predictable performance keeps CI affordable and ensures compliance checks run on every change.

## Compliance & Security Standards

- SBOMs MUST capture 100% third-party components from both dependency graphs and source scanning; missing coverage requires a tracked issue before release.
- Fossology license identification accuracy MUST exceed 95%; deviations require documented mitigations and follow-up scans.
- Toolchain integrity: pin ORT/Fossology versions, disable remote downloaders unless explicitly approved, and verify container/image hashes in CI.
- Sensitive data (API keys, paths) stays out of logs and reports; redact where necessary and store credentials via standard secrets management.

## Development Workflow & Quality Gates

- Every feature begins with spec.md and plan.md describing UX impact, test plan, and performance budgets; no implementation without a passing Constitution Check in the plan.
- PRs MUST include evidence of lint/format, test runs (unit, integration/contract), and performance considerations; reviewers block merges on principle violations.
- CLI/API changes require updated docs/examples and contract tests; deprecations are tracked with timelines and migration steps.
- Release artifacts follow semantic versioning aligned to governance; changelogs document SBOM/UX/test-impacting changes and any temporary waivers.

## Governance

- This constitution governs all development for ORT-FOSS SBOM and supersedes prior informal practices.
- Amendments occur via PR that explains the change, updates this document, bumps the version per policy, and records impacts in the Sync Impact Report.
- Versioning policy: MAJOR for removals or incompatible principle changes; MINOR for new principles/sections or materially expanded guidance; PATCH for clarifications without behavioral change.
- Compliance reviews run on each major feature and release: verify principles, Constitution Check gates, and adherence in plan/spec/tasks; non-compliance requires explicit, time-bound waivers.

**Version**: 1.0.0 | **Ratified**: 2025-11-29 | **Last Amended**: 2025-11-29
