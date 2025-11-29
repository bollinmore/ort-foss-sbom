# Feature Specification: Automated ORT + Fossology Compliance Scanner

**Feature Branch**: `001-ort-fossology-compliance`  
**Created**: 2025-11-29  
**Status**: Draft  
**Input**: User description: "建立一個自動化開源軟體合規性檢查工具，整合 OSS Review Toolkit (ORT) 與 Fossology，從本地軟體原始碼產生完整 SBOM 並確認所有第三方套件授權合規。"

**Cross-Cutting Obligations**: Keep CLI/JSON UX stable and non-interactive, target <15m p95 runtime for representative scans, preserve strict code quality and deterministic offline test fixtures, and document migration notes for any breaking UX.

## Clarifications

### Session 2025-11-29
- Q: How should compliance failures be determined when assessing licenses? → A: Fail on incompatible OR unknown licenses; warnings for low-risk notices.

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Run offline compliance scan from local source (Priority: P1)

An engineering operator triggers a single command against a local project path to analyze dependencies, generate an SPDX SBOM, and upload artifacts to the compliance service without fetching remote packages.

**Why this priority**: This delivers the core value of automated SBOM and license discovery needed for any compliance assessment.

**Independent Test**: Run the command against a representative local repo with network downloaders disabled and verify SBOM generation and upload succeed without external fetches.

**Acceptance Scenarios**:

1. **Given** a local project path and configured credentials, **When** the operator runs the compliance command, **Then** the system completes ORT analysis and scanning without remote downloads and packages the results for upload.
2. **Given** a completed scan, **When** artifacts are uploaded, **Then** the system records a job identifier and returns the SBOM location for traceability.

---

### User Story 2 - Monitor scan status and license findings (Priority: P2)

A compliance reviewer retrieves scan status and license findings for a submitted job, ensuring Fossology classification reaches required accuracy and flags risks.

**Why this priority**: Reviewers need timely visibility into license results to approve or block releases.

**Independent Test**: Poll a known job ID until completion and verify status transitions, license counts, and risk flags are reported consistently.

**Acceptance Scenarios**:

1. **Given** a job ID for an uploaded scan, **When** the reviewer checks status, **Then** the system reports stage progression (analyze, scan, upload, license review) and completion timestamp.
2. **Given** completed license analysis, **When** the reviewer fetches results, **Then** the response includes detected licenses, risk markers, and coverage percentages.

---

### User Story 3 - Consume consolidated compliance report in CI/CD (Priority: P3)

An automation engineer runs the pipeline in CI to fail builds on license risks or missing coverage and downloads the merged report (SBOM + Fossology findings) as an artifact.

**Why this priority**: CI integration enforces compliance on every change and produces auditable outputs.

**Independent Test**: Execute the command in CI with a sample project and assert the job fails when risk thresholds are breached, while publishing the consolidated report for download.

**Acceptance Scenarios**:

1. **Given** CI credentials and a project path, **When** the pipeline runs the compliance command, **Then** it exits non-zero if license risks exceed policy and attaches the merged report as an artifact.
2. **Given** a successful run, **When** the CI job completes, **Then** the merged report is available for downstream jobs and contains both SBOM and license risk summary.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- Project path missing or unreadable → system reports actionable error without partial uploads.
- Fossology service unreachable or times out → job surfaces retryable status and clear failure reason without losing artifacts.
- ORT scan detects components without identifiable licenses → report flags unknowns and marks coverage gaps.
- Large repositories or binary blobs inflate artifacts → pipeline streams or caps artifact size while keeping runtime within target budget.
- CI risk breach → pipeline fails within 1 minute of detection and publishes merged report artifact.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST provide a single non-interactive command to perform ORT analysis, scan, packaging, and submission from a local project path with remote downloads disabled by default.
- **FR-002**: System MUST generate an SPDX SBOM that captures 100% third-party components from dependency graphs and source scanning, including version and path metadata.
- **FR-003**: System MUST upload the SBOM and supporting artifacts to the Fossology API, returning a job identifier for tracking.
- **FR-004**: System MUST expose job status that reflects pipeline stages (analyze, scan, upload, license review) with timestamps and error reasons.
- **FR-005**: System MUST retrieve Fossology license findings and merge them with the SBOM into a consolidated human-readable and machine-consumable report.
- **FR-006**: System MUST flag license risks (e.g., unknown, incompatible, or missing attributions) and mark runs as failed when policy thresholds are exceeded, returning a non-zero exit code and risk summary fields.
- **FR-007**: System MUST complete the end-to-end pipeline within 15 minutes p95 for a representative project size and surface progress/timeouts when nearing limits; runtime is measured via CI E2E fixture job.
- **FR-008**: System MUST operate deterministically in offline or restricted-network environments by using fixtures/mocks for tests and disallowing unapproved downloads.
- **FR-009**: System MUST provide structured, stage-scoped logs and actionable error messages suitable for auditors and CI consumption, with secrets/paths redacted.
- **FR-010**: System MUST allow CI/CD execution with configurable output locations for reports and non-zero exits on compliance failures.

### Key Entities *(include if feature involves data)*

- **ProjectInput**: Describes the local project path and scan configuration (e.g., downloader toggles, exclusions).
- **ScanJob**: Tracks a single pipeline execution with stages, timestamps, status, and associated artifact references.
- **SBOMArtifact**: SPDX output capturing dependency and source component inventory with metadata for traceability.
- **LicenseAssessment**: Fossology-derived license findings, confidence levels, and risk flags tied to SBOM components.
- **ComplianceReport**: Consolidated output combining SBOM and license assessments, including coverage, risks, and download locations.

### Assumptions

- Fossology endpoint and credentials are pre-configured and reachable from the execution environment.
- Representative project size used for performance targets matches typical local repositories intended for scanning.
- Compliance policies and license risk thresholds are defined outside this feature but are available for evaluation.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: 100% of third-party components detected in both dependency graph and source scanning are present in the generated SBOM.
- **SC-002**: Fossology license identification accuracy exceeds 95% for scanned components, with discrepancies documented.
- **SC-003**: End-to-end scan completes in under 15 minutes p95 for the defined representative project, measured via CI fixture job.
- **SC-004**: CI/CD runs fail within 1 minute of detecting a license policy violation and produce a downloadable merged report for every run.
- **SC-005**: Operators/reviewers obtain status updates and risk summaries within 30 seconds of request for any in-progress or completed job.
- **SC-006**: License accuracy on fixtures meets or exceeds 95% with documented discrepancies.
