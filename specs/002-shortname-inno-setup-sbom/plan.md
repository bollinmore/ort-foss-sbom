# Implementation Plan: Inno Setup Installer SBOM Extraction

**Branch**: `002-shortname-inno-setup-sbom` | **Date**: 2025-12-02 | **Spec**: specs/002-shortname-inno-setup-sbom/spec.md  
**Input**: Feature specification from `/specs/002-shortname-inno-setup-sbom/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Deliver a CLI workflow that ingests an Inno Setup installer, unpacks all payload files deterministically, classifies each file (type, arch/lang context, metadata), derives license evidence from README/License resources, and emits file-level SBOMs in both SPDX 2.3 and CycloneDX 1.6 JSON formats with identical coverage plus CI-friendly status outputs and logs.

## Technical Context

**Language/Version**: Node.js 18+, TypeScript (strict)  
**Primary Dependencies**: ORT CLI, Fossology REST client, `innounp` (primary) with `innoextract` fallback, `@cyclonedx/cyclonedx-library` for CycloneDX 1.6, internal SPDX 2.3 JSON emitter validated via AJV  
**Storage**: Local filesystem workspace for extraction artifacts and SBOM outputs; no persistent DB  
**Testing**: Jest + ts-jest with offline fixtures spanning simple installer, multi-arch/lang payload, metadata-rich binaries, corrupted/truncated installer, and unsupported compression/multi-volume cases  
**Target Platform**: Node CLI running on Windows or Linux runners with access to unpacker binaries; offline-capable  
**Project Type**: Single CLI/service project  
**Performance Goals**: End-to-end scan (<=1 GB installer) completes within 15 minutes p95 with deterministic outputs and identical coverage across SPDX/CycloneDX  
**Constraints**: Offline by default (no external network calls), deterministic extraction, explicit errors on unsupported compression/segments, memory bounded to fit common CI runners, preserve original install paths and metadata  
**Scale/Scope**: Single installer per run; file-level SBOM covering 100% extracted files with license evidence and metadata

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Code Quality & Maintainability: Plan enforces strict TypeScript, small modules for extractor/classifier/SBOM emitters, pinned external unpacker versions, and documented invariants per stage.
- Testing Standards & Determinism: Unit + integration/contract tests planned with offline fixtures (including corrupted/unsupported installers), golden SBOMs for determinism, and no live network in tests.
- User Experience Consistency: CLI flags and outputs stay stable; machine-readable exit codes and JSON summaries documented; breaking changes require migration notes.
- Performance & Reliability: Runtime budget <15m p95 for <=1 GB installers; retries/timeouts for external tools; explicit failure on unsupported formats; avoid unnecessary downloads/concurrency beyond deterministic bounds.

**Post-Design Constitution Check**: PASS — all principles addressed with offline fixtures, deterministic SBOM emitters, stable CLI contract, and runtime/error budgets aligned to <15m p95 target.

## Project Structure

### Documentation (this feature)

```text
specs/002-shortname-inno-setup-sbom/
- plan.md              # This file (/speckit.plan command output)
- research.md          # Phase 0 output (/speckit.plan command)
- data-model.md        # Phase 1 output (/speckit.plan command)
- quickstart.md        # Phase 1 output (/speckit.plan command)
- contracts/           # Phase 1 output (/speckit.plan command)
- tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
- cli/
- lib/
- models/
- services/

tests/
- contract/
- fixtures/
- integration/
- unit/
```

**Structure Decision**: Use existing single-project layout with CLI/services/lib/modules under `src/` and corresponding contract/integration/unit test suites under `tests/`. New feature components (Inno unpacker integration, file classifier, SBOM emitters) will be added within this structure.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
