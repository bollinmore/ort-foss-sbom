export type ExtractorTool = 'innounp' | 'innoextract';

export interface InstallerPackage {
  sourcePath: string;
  sizeBytes: number;
  checksum: string;
  signatureStatus: 'unsigned' | 'signed' | 'invalid_signature';
  compression: string;
  segments: string[];
}

export interface ExtractionError {
  code: 'UNSUPPORTED_COMPRESSION' | 'MISSING_SEGMENT' | 'PASSWORD_PROTECTED' | 'CORRUPTED' | 'TIMEOUT' | 'UNKNOWN';
  message: string;
  segment?: string;
}

export type ExtractionStatus = 'pending' | 'extracting' | 'extracted' | 'failed';

export interface ExtractionWorkspace {
  workdir: string;
  extractor: ExtractorTool;
  status: ExtractionStatus;
  errors: ExtractionError[];
}

export type FileType = 'executable' | 'dll' | 'script' | 'resource' | 'config' | 'documentation' | 'other';

export type Architecture = 'x86' | 'x64' | 'arm64' | 'unknown';

export interface FileMetadata {
  productName?: string;
  fileDescription?: string;
  fileVersion?: string;
  companyName?: string;
  resources?: Record<string, unknown>;
}

export type FileStatus = 'ok' | 'unsupported' | 'failed';

export interface ExtractedFile {
  id: string;
  installPath: string;
  extractedPath: string;
  sizeBytes: number;
  checksum: string;
  type: FileType;
  architecture: Architecture;
  language: string;
  metadata?: FileMetadata;
  status: FileStatus;
  statusMessage?: string;
}

export type EvidenceType = 'readme' | 'license_file' | 'resource_string' | 'binary_metadata';

export interface LicenseEvidence {
  id: string;
  sourceFileId: string;
  evidenceType: EvidenceType;
  licenseSpdxId?: string;
  extractedText?: string;
  snippetHash?: string;
  confidence: number;
  summary: string;
}

export type ClassificationStatus = 'classified' | 'manual_review_required';

export interface SBOMEntry {
  fileId: string;
  path: string;
  checksum: string;
  fileType: FileType;
  license: string;
  evidenceIds: string[];
  metadataRef?: string;
  classificationStatus: ClassificationStatus;
  architecture?: Architecture;
  language?: string;
}

export type ScanStatus = 'pending' | 'extracting' | 'classifying' | 'sbom_emitting' | 'failed' | 'completed';

export interface SBOMPaths {
  spdxPath?: string;
  cyclonedxPath?: string;
}

export interface ScanCoverage {
  extracted: number;
  classified: number;
  metadataComplete?: number;
}

export interface CoverageThresholds {
  extracted: number;
  classified: number;
  metadataComplete?: number;
}

export interface ScanReportError {
  code: string;
  message: string;
  fileId?: string;
  segment?: string;
}

export interface ScanReportTimings {
  extractSeconds?: number;
  classifySeconds?: number;
  emitSeconds?: number;
}

export interface ScanReport {
  jobId: string;
  startedAt: string;
  completedAt?: string;
  status: ScanStatus;
  errors: ScanReportError[];
  coverage: ScanCoverage;
  coverageThresholds?: CoverageThresholds;
  sbom: SBOMPaths;
  extractor?: ExtractorTool;
  logs?: string;
  timings?: ScanReportTimings;
}
