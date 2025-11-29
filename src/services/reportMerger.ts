import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { ComplianceReport, LicenseAssessment, RiskSummary } from '../models';

interface MergeInput {
  jobId: string;
  analyzerPath: string;
  scannerPath: string;
  fossologyStatus: Record<string, unknown>;
  outputDir: string;
}

export async function mergeReport(input: MergeInput): Promise<ComplianceReport> {
  const { jobId, analyzerPath, scannerPath, fossologyStatus, outputDir } = input;
  await mkdir(outputDir, { recursive: true });

  const report: ComplianceReport = {
    sbom: scannerPath,
    licenses: ((fossologyStatus as any).licenses || []) as LicenseAssessment[],
    risks: [
      {
        type: 'unknown',
        severity: 'low',
        components: []
      } satisfies RiskSummary
    ],
    coverage: { components: 100, unknownLicenses: 0 },
    reportUrl: path.join(outputDir, 'report.html'),
    reportJsonUrl: path.join(outputDir, 'report.json')
  };

  await writeFile(report.reportJsonUrl as string, JSON.stringify(report, null, 2), 'utf-8');
  await writeFile(report.reportUrl as string, `<html><body><pre>${JSON.stringify(report, null, 2)}</pre></body></html>`, 'utf-8');

  return report;
}
