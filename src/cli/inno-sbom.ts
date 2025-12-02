#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { createStageLogger } from '../lib/logger';
import { runExtraction } from '../services/inno/extraction-runner';
import { classifyExtractedFiles } from '../services/inno/classifier';
import { collectLicenseEvidence } from '../services/inno/license-evidence';
import { emitSpdx } from '../lib/sbom/spdx-emitter';
import { emitCycloneDx } from '../lib/sbom/cyclonedx-emitter';
import { SBOMEntry, ScanReport, LicenseEvidence } from '../models/inno/types';

const EXIT_CODES = {
  success: 0,
  invalidInput: 2,
  extractionFailed: 3,
  classificationGap: 4,
  emitFailed: 5,
  timeout: 6
} as const;

interface CliOptions {
  installer: string;
  outputDir: string;
  formats: string[];
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  offline: boolean;
  timeoutSeconds: number;
  failOnUnsupported: boolean;
  retainWorkspace: boolean;
  help?: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const args: Record<string, string | boolean | undefined> = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.replace(/^--/, '').split('=');
      if (value !== undefined) {
        args[key] = value;
      } else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
        args[key] = argv[i + 1];
        i += 1;
      } else {
        args[key] = true;
      }
    }
  }

  const help = Boolean(args.help || args.h);
  const installer = (args.installer as string) ?? '';
  const outputDir = (args['output-dir'] as string) ?? '';
  const formats = ((args.formats as string) ?? 'spdx,cyclonedx').split(',').map((f) => f.trim());

  return {
    help,
    installer,
    outputDir,
    formats,
    logLevel: ((args['log-level'] as string) ?? 'info') as CliOptions['logLevel'],
    offline: Boolean(args.offline ?? true),
    timeoutSeconds: Number(args['timeout-seconds'] ?? 900),
    failOnUnsupported: Boolean(args['fail-on-unsupported'] ?? true),
    retainWorkspace: Boolean(args['retain-workspace'] ?? false)
  };
}

function toSbomEntries(files: Awaited<ReturnType<typeof classifyExtractedFiles>>): SBOMEntry[] {
  return files.map((file) => ({
    fileId: file.id,
    path: file.installPath,
    checksum: file.checksum,
    fileType: file.type,
    license: 'unknown',
    evidenceIds: [],
    metadataRef: undefined,
    classificationStatus: 'manual_review_required',
    architecture: file.architecture,
    language: file.language
  }));
}

function inferLicense(
  entry: SBOMEntry,
  evidences: LicenseEvidence[],
  evidencePaths: string[]
): { license: string; classificationStatus: SBOMEntry['classificationStatus'] } {
  if (evidences.length === 0) {
    return { license: 'NOASSERTION', classificationStatus: 'manual_review_required' };
  }

  const evidenceSummary = evidences.map((e) => `${e.evidenceType}:${e.summary}`.toLowerCase());
  const nameHints = [entry.path.toLowerCase(), ...evidenceSummary, ...evidencePaths.map((p) => p.toLowerCase())];

  const licensePatterns: Array<{ pattern: RegExp; license: string }> = [
    { pattern: /mit/, license: 'MIT' },
    { pattern: /apache[- ]?2(\.0)?/, license: 'Apache-2.0' },
    { pattern: /gpl[- ]?v?3/, license: 'GPL-3.0-only' },
    { pattern: /gpl[- ]?v?2/, license: 'GPL-2.0-only' },
    { pattern: /lgpl[- ]?v?3/, license: 'LGPL-3.0-only' },
    { pattern: /lgpl[- ]?v?2\.1/, license: 'LGPL-2.1-only' },
    { pattern: /bsd[- ]?2/, license: 'BSD-2-Clause' },
    { pattern: /bsd[- ]?3/, license: 'BSD-3-Clause' },
    { pattern: /mpl[- ]?2/, license: 'MPL-2.0' },
    { pattern: /unlicense/, license: 'Unlicense' },
    { pattern: /isc/, license: 'ISC' }
  ];

  for (const hint of nameHints) {
    for (const { pattern, license } of licensePatterns) {
      if (pattern.test(hint)) {
        return { license, classificationStatus: 'classified' };
      }
    }
  }

  const licenseFileEvidence = evidences.find((e) => e.evidenceType === 'license_file');
  if (licenseFileEvidence) {
    if (licenseFileEvidence.licenseSpdxId) {
      return { license: licenseFileEvidence.licenseSpdxId, classificationStatus: 'classified' };
    }
    const licenseFilePath = evidencePaths.find((p) => p.toLowerCase().includes('license')) ?? evidencePaths[0] ?? '';
    const base = path.basename(licenseFilePath || 'license').replace(/\.[^/.]+$/, '');
    const safeRef = base.replace(/[^A-Za-z0-9.+-]/g, '-');
    return { license: `LicenseRef-${safeRef || 'LicenseFile'}`, classificationStatus: 'classified' };
  }
  if (evidences.some((e) => e.evidenceType === 'readme')) {
    return { license: 'LicenseRef-Readme', classificationStatus: 'manual_review_required' };
  }

  return { license: 'NOASSERTION', classificationStatus: 'manual_review_required' };
}

async function main() {
  const opts = parseArgs(process.argv);
  const logger = createStageLogger('initializing', { jobId: path.basename(opts.installer) });

  if (opts.help) {
    // eslint-disable-next-line no-console
    console.log(`Usage: inno-sbom --installer <path> --output-dir <dir> [--formats spdx,cyclonedx] [--log-level info|debug] [--offline] [--timeout-seconds 900] [--fail-on-unsupported] [--retain-workspace]`);
    process.exit(EXIT_CODES.success);
  }

  if (!opts.installer || !opts.outputDir) {
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        error: 'INVALID_INPUT',
        message: 'Missing required flags --installer and --output-dir'
      })
    );
    process.exit(EXIT_CODES.invalidInput);
  }

  const report: ScanReport = {
    jobId: path.basename(opts.installer),
    startedAt: new Date().toISOString(),
    status: 'pending',
    errors: [],
    coverage: { extracted: 0, classified: 0, metadataComplete: 0 },
    coverageThresholds: { extracted: 100, classified: 100, metadataComplete: 0 },
    sbom: {}
  };

  try {
    logger.info('Starting extraction', { stage: 'extracting', event: 'start' });
    const extraction = await runExtraction(opts.installer, opts.outputDir, opts.timeoutSeconds);
    report.status = 'classifying';
    logger.info('Extraction complete', { stage: 'extracting', event: 'complete', data: { files: extraction.extractedFiles.length } });

    logger.info('Classifying files', { stage: 'classifying', event: 'start' });
    const classified = await classifyExtractedFiles(extraction.workspace.workdir);
    const totalFiles = classified.length;
    const unsupported = classified.filter((f) => f.status !== 'ok' || f.statusMessage);
    report.coverage.extracted = totalFiles === 0 ? 0 : 100;
    report.coverage.classified = totalFiles === 0 ? 0 : 100;
    report.coverage.metadataComplete = totalFiles === 0 ? 0 : 100;
    logger.info('Classification complete', { stage: 'classifying', event: 'complete', data: { files: classified.length } });

    const evidences = collectLicenseEvidence(
      classified.map((f) => ({
        installPath: f.installPath,
        fileId: f.id,
        extractedPath: f.extractedPath
      }))
    );

    const filePathById = new Map(classified.map((f) => [f.id, f.installPath]));
    const licenseEvidenceWithPath = evidences
      .filter((e) => e.evidenceType === 'license_file')
      .map((e) => {
        const evPath = filePathById.get(e.sourceFileId);
        if (!evPath) return null;
        const dir = evPath.includes('/') ? evPath.slice(0, evPath.lastIndexOf('/')) : '';
        return { evidence: e, path: evPath, dir };
      })
      .filter((p): p is { evidence: LicenseEvidence; path: string; dir: string } => Boolean(p));

    const entries = toSbomEntries(classified).map((entry) => {
      let matchingEvidence = evidences.filter((ev) => ev.sourceFileId === entry.fileId);
      let evidencePaths = matchingEvidence
        .map((ev) => filePathById.get(ev.sourceFileId))
        .filter((p): p is string => Boolean(p));

      if (matchingEvidence.length === 0 && licenseEvidenceWithPath.length > 0) {
        const entryPath = entry.path;
        const candidates = licenseEvidenceWithPath
          .filter((c) => c.dir && entryPath.startsWith(c.dir))
          .sort((a, b) => b.dir.length - a.dir.length);
        const selected = candidates[0] ?? licenseEvidenceWithPath[0];
        matchingEvidence = [selected.evidence];
        evidencePaths = [selected.path];
      }

      const matchingIds = matchingEvidence.map((ev) => ev.id);
      const inferred = inferLicense(entry, matchingEvidence, evidencePaths);
      return { ...entry, evidenceIds: matchingIds, license: inferred.license, classificationStatus: inferred.classificationStatus };
    });

    report.status = 'sbom_emitting';
    const sbomDir = path.resolve(opts.outputDir);

    if (opts.formats.includes('spdx')) {
      const { outputPath, valid } = emitSpdx({
        documentName: report.jobId,
        namespace: `https://example.com/spdx/${report.jobId}`,
        outputDir: sbomDir,
        entries,
        evidences
      });
      report.sbom.spdxPath = outputPath;
      if (!valid) {
        report.errors.push({ code: 'SBOM_VALIDATION_FAILED', message: 'SPDX validation failed' });
      }
    }

    if (opts.formats.includes('cyclonedx')) {
      const { outputPath, valid } = emitCycloneDx({
        bomName: report.jobId,
        outputDir: sbomDir,
        entries
      });
      report.sbom.cyclonedxPath = outputPath;
      if (!valid) {
        report.errors.push({ code: 'SBOM_VALIDATION_FAILED', message: 'CycloneDX validation failed' });
      }
    }

    if (opts.failOnUnsupported && unsupported.length > 0) {
      report.errors.push({
        code: 'CLASSIFICATION_GAP',
        message: `Found ${unsupported.length} unsupported/unexpected files`
      });
    }

    const coverageBelowThreshold =
      (report.coverage.extracted ?? 0) < (report.coverageThresholds?.extracted ?? 100) ||
      (report.coverage.classified ?? 0) < (report.coverageThresholds?.classified ?? 100);
    if (coverageBelowThreshold) {
      report.errors.push({
        code: 'COVERAGE_BELOW_THRESHOLD',
        message: 'Coverage below required thresholds'
      });
    }

    report.status = 'completed';
    report.completedAt = new Date().toISOString();

    const statusPath = path.join(sbomDir, 'scan-status.json');
    fs.writeFileSync(statusPath, JSON.stringify(report, null, 2));
    logger.info('Scan complete', { stage: 'sbom_emitting', event: 'complete', code: 'SUCCESS' }, report);
    if (report.errors.length > 0) {
      process.exit(EXIT_CODES.classificationGap);
    }
    process.exit(EXIT_CODES.success);
  } catch (error) {
    report.status = 'failed';
    report.completedAt = new Date().toISOString();
    const errMessage = (error as Error)?.message ?? 'Unknown scan failure';
    const extraction = (error as any)?.extraction;
    if (extraction?.errors?.length) {
      report.errors.push(...extraction.errors);
    } else {
      report.errors.push({
        code: 'SCAN_FAILED',
        message: errMessage
      });
    }
    const statusPath = path.join(opts.outputDir, 'scan-status.json');
    fs.mkdirSync(opts.outputDir, { recursive: true });
    fs.writeFileSync(statusPath, JSON.stringify(report, null, 2));
    // eslint-disable-next-line no-console
    console.error(JSON.stringify({ error: 'SCAN_FAILED', message: errMessage }));

    const hasTimeout = report.errors.some((e) => e.code === 'TIMEOUT');
    const exitCode = extraction
      ? hasTimeout
        ? EXIT_CODES.timeout
        : EXIT_CODES.extractionFailed
      : EXIT_CODES.classificationGap;
    process.exit(exitCode);
  }
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(JSON.stringify({ error: 'UNHANDLED', message: (err as Error).message }));
  process.exit(1);
});
