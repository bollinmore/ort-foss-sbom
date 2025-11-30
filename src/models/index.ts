export type JobStatus =
  | 'queued'
  | 'analyzing'
  | 'scanning'
  | 'uploading'
  | 'license_review'
  | 'completed'
  | 'failed';

export interface OrtConfig {
  downloaderEnabled?: boolean; // defaults to false for offline runs
  includes?: string[];
  excludes?: string[];
  timeoutSeconds?: number;
  outputDir?: string;
  /**
   * integrationMode: fixture uses offline fixtures; live triggers actual ORT/Fossology calls.
   */
  integrationMode?: 'fixture' | 'live';
  ortCliPath?: string; // optional override, otherwise resolved from PATH
  fossologyApiUrl?: string;
  fossologyToken?: string;
  fossologyPollSeconds?: number; // interval between Fossology status polls
  maxArtifactSizeBytes?: number; // cap to guard against oversized uploads
  simulateRisk?: boolean; // test-only toggle to simulate license risk failure
  verbose?: boolean; // stream ORT stdout/stderr
}

export interface ProjectInput {
  localPath: string;
  config?: OrtConfig;
}

export interface ScanJob {
  jobId: string;
  status: JobStatus;
  startedAt?: string;
  completedAt?: string | null;
  errors?: string[];
  artifacts?: {
    sbom?: string;
    report?: string;
    reportJson?: string;
    logs?: string;
  };
  stage?: string;
  progressPercent?: number;
}

export interface OrtScanResult {
  analyzer: string; // path/reference to analyzer output
  scanner: string; // path/reference to SPDX output
  summary?: {
    components?: number;
    packages?: number;
    vulnerabilities?: number;
  };
}

export type FossologyStatus = 'scheduled' | 'in_progress' | 'completed' | 'failed';

export interface FossologyUpload {
  uploadId: number;
  scanResult: string; // SPDX reference used for upload
  status: FossologyStatus;
  findings?: {
    licenseCount?: number;
    unknownLicenses?: number;
    incompatibleLicenses?: number;
  };
}

export type RiskFlag = 'unknown' | 'incompatible' | 'missing-attribution';

export interface LicenseAssessment {
  componentId: string;
  licenses: Array<{ id: string; confidence: number }>;
  riskFlags: RiskFlag[];
}

export interface RiskSummary {
  type: RiskFlag;
  severity: 'low' | 'medium' | 'high';
  components: string[];
}

export interface ComplianceReport {
  sbom: string;
  licenses: LicenseAssessment[];
  risks: RiskSummary[];
  coverage: {
    components: number;
    unknownLicenses: number;
  };
  reportUrl?: string;
  reportJsonUrl?: string;
}
