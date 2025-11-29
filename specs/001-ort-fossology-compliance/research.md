# Research: Automated ORT + Fossology Compliance Scanner
**Date**: 2025-11-29  
**Feature**: /Users/chenwensheng/Documents/Codes/bollinmore/ort-foss-sbom/specs/001-ort-fossology-compliance/spec.md

## Decisions

- **Stack**: Use Node.js 18+ with strict TypeScript, ORT CLI, Fossology REST, and Docker Compose for local orchestration.  
  - **Rationale**: Matches feature spec and repository context; TS strictness supports code quality principle.  
  - **Alternatives considered**: Other languages/frameworks rejected to stay aligned with repo direction.

- **Offline-by-default scanning**: Disable ORT downloader and rely on local sources/fixtures.  
  - **Rationale**: Constitution requires deterministic, offline-safe runs; user request explicitly bans remote downloads.  
  - **Alternatives considered**: Allow conditional downloads—rejected due to compliance drift risk.

- **License failure policy**: Fail on incompatible OR unknown licenses; warn on low-risk notices.  
  - **Rationale**: Clarification outcome ensures deterministic compliance enforcement aligned with spec.  
  - **Alternatives considered**: Fail only on incompatible; policy-file-only—both insufficient for strict compliance.

- **Performance target**: <15m p95 end-to-end for representative repo with streaming/capped artifacts.  
  - **Rationale**: Matches constitution performance requirement and user success criteria.  
  - **Alternatives considered**: Looser targets rejected to keep CI usable.

- **Testing approach**: Unit + integration + contract tests using recorded fixtures/golden outputs; forbid live network in tests.  
  - **Rationale**: Satisfies testing standards and determinism principles.  
  - **Alternatives considered**: Live integration tests—rejected for nondeterminism.
