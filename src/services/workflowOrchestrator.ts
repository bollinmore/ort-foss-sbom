import { createWriteStream } from 'fs';
import { stat } from 'fs/promises';
import { pipeline } from 'stream/promises';
import { PassThrough, type Readable } from 'stream';
import path from 'path';
import { createLogger } from '../lib/logger';
import { runOrtScan } from './ortRunner';
import { uploadSpdx, fetchFossologyStatus } from './fossologyClient';
import { ProjectInput, ComplianceReport } from '../models';
import { mergeReport } from './reportMerger';
import { jobStore } from './jobStore';

const logger = createLogger({ stage: 'orchestrator' });

const DEFAULT_MAX_ARTIFACT_BYTES = 500 * 1024 * 1024; // 500MB cap per spec edge case

export class ArtifactTooLargeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ArtifactTooLargeError';
  }
}

/**
 * Streams an artifact to disk while enforcing a maximum size.
 * Throws ArtifactTooLargeError if the size cap is exceeded.
 */
export async function writeArtifactWithCap(
  readable: Readable,
  destination: string,
  maxBytes: number = DEFAULT_MAX_ARTIFACT_BYTES
): Promise<void> {
  let bytes = 0;
  const counting = new PassThrough();
  counting.on('data', (chunk: Buffer) => {
    bytes += chunk.length;
    if (bytes > maxBytes) {
      counting.destroy(new ArtifactTooLargeError('ARTIFACT_TOO_LARGE'));
    }
  });

  const sink = createWriteStream(destination, { flags: 'w' });

  try {
    await pipeline(readable, counting, sink);
    logger.info('artifact_written', {
      code: 'ARTIFACT_WRITTEN',
      event: 'artifact_written',
      data: { destination, bytes }
    });
  } catch (err) {
    sink.destroy();
    logger.error('artifact_write_failed', {
      code: 'ARTIFACT_WRITE_FAILED',
      event: 'artifact_write_failed',
      data: { destination, bytes, error: (err as Error).message }
    });
    throw err;
  }
}

/**
 * Quick check to ensure an existing artifact does not exceed the cap.
 */
export async function assertArtifactWithinCap(
  filePath: string,
  maxBytes: number = DEFAULT_MAX_ARTIFACT_BYTES
): Promise<void> {
  const stats = await stat(filePath);
  if (stats.size > maxBytes) {
    throw new ArtifactTooLargeError('ARTIFACT_TOO_LARGE');
  }
}

export interface OrchestrateResult {
  jobId: string;
  report: ComplianceReport;
}

/**
 * Minimal offline orchestrator to satisfy US1 flow.
 */
export async function orchestrateScan(input: ProjectInput): Promise<OrchestrateResult> {
  const jobId = `job-${Date.now()}`;
  logger.info('scan_started', { jobId, event: 'scan_started' });
  jobStore.create(jobId);
  jobStore.update(jobId, 'analyzing', 'analyze', 10);

  const outputDir = path.resolve(input.config?.outputDir ?? './out', jobId);

  const { analyzerPath, scannerPath } = await runOrtScan({
    ...input,
    config: {
      ...input.config,
      outputDir
    }
  });
  logger.info('ort_scan_complete', { jobId, event: 'ort_scan_complete' });
  jobStore.update(jobId, 'scanning', 'scan', 40);

  const upload = await uploadSpdx(scannerPath, {
    apiUrl: input.config?.fossologyApiUrl || process.env.FOSSOLOGY_API_URL || 'http://fossology:8081',
    token: input.config?.fossologyToken || process.env.FOSSOLOGY_TOKEN || 'test-token',
    mode: input.config?.integrationMode === 'live' ? 'live' : 'stub',
    maxArtifactSizeBytes: input.config?.maxArtifactSizeBytes ?? 500 * 1024 * 1024,
    pollSeconds: input.config?.fossologyPollSeconds ?? 5,
    folderId: input.config?.fossologyFolderId ?? process.env.FOSSOLOGY_FOLDER_ID ?? '1',
    folderName: input.config?.fossologyFolderName ?? process.env.FOSSOLOGY_FOLDER_NAME ?? 'uploads',
    uploadType: input.config?.fossologyUploadType ?? (process.env.FOSSOLOGY_UPLOAD_TYPE as any) ?? 'file',
    accessLevel: input.config?.fossologyAccessLevel ?? (process.env.FOSSOLOGY_ACCESS_LEVEL as any) ?? 'private'
  });
  logger.info('upload_scheduled', { jobId, event: 'upload_scheduled', data: upload });
  jobStore.update(jobId, 'uploading', 'upload', 60);

  const fossologyStatus = await fetchFossologyStatus(upload.uploadId, {
    apiUrl: input.config?.fossologyApiUrl || process.env.FOSSOLOGY_API_URL || 'http://fossology:8081',
    token: input.config?.fossologyToken || process.env.FOSSOLOGY_TOKEN || 'test-token',
    mode: input.config?.integrationMode === 'live' ? 'live' : 'stub'
  });
  logger.info('license_review_complete', { jobId, event: 'license_review_complete' });
  const hasRisk = Boolean((fossologyStatus as any).risks?.length || (fossologyStatus as any).unknownLicenses > 0 || input.config?.simulateRisk);
  jobStore.update(jobId, hasRisk ? 'failed' : 'license_review', 'license_review', 80, hasRisk ? 'LICENSE_UNKNOWN' : undefined);

  const report = await mergeReport({
    jobId,
    analyzerPath,
    scannerPath,
    fossologyStatus,
    outputDir,
    hasRisk
  });

  jobStore.setArtifacts(jobId, {
    sbom: report.sbom,
    report: report.reportUrl,
    reportJson: report.reportJsonUrl
  });
  jobStore.update(jobId, hasRisk ? 'failed' : 'completed', 'completed', 100, hasRisk ? 'LICENSE_UNKNOWN' : undefined);

  return { jobId, report };
}
