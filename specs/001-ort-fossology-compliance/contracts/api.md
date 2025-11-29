# API Contracts: Automated ORT + Fossology Compliance Scanner

## POST /scan
- **Purpose**: Start full scan pipeline from a local project path.
- **Request Body**:
```json
{
  "localPath": "/abs/path/to/project",
  "config": {
    "downloaderEnabled": false,
    "includes": ["**/*"],
    "excludes": ["**/node_modules/**"],
    "timeoutSeconds": 900
  }
}
```
- **Responses**:
  - 202 Accepted
```json
{
  "jobId": "job-123",
  "status": "queued"
}
```
  - 400 Bad Request (invalid path/config)
  - 500 Internal Error (pipeline start failure)

## GET /status/:jobId
- **Purpose**: Retrieve pipeline status and timestamps.
- **Path Params**: `jobId` (string)
- **Responses**:
  - 200 OK
```json
{
  "jobId": "job-123",
  "status": "license_review",
  "startedAt": "2025-11-29T10:00:00Z",
  "completedAt": null,
  "stage": "upload",
  "progress": { "percent": 60 },
  "error": null
}
```
  - 404 Not Found (unknown job)

## GET /report/:jobId
- **Purpose**: Download merged compliance report (SBOM + license findings).
- **Path Params**: `jobId` (string)
- **Responses**:
  - 200 OK
```json
{
  "jobId": "job-123",
  "reportUrl": "https://.../reports/job-123.html",
  "sbomUrl": "https://.../reports/job-123.spdx.json",
  "risks": [
    { "componentId": "pkg:npm/leftpad@1.0.0", "flags": ["unknown"] }
  ],
  "coverage": { "components": 100, "unknownLicenses": 0 }
}
```
  - 404 Not Found (unknown job or report not ready)

## Error Model
- `error`: string message describing failure with actionable remediation.
- `code`: optional machine-readable code (e.g., `INVALID_PATH`, `UPLOAD_FAILED`).
