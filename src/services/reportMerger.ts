import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { ComplianceReport, LicenseAssessment, RiskFlag, RiskSummary } from '../models';

interface MergeInput {
  jobId: string;
  analyzerPath: string;
  scannerPath: string;
  fossologyStatus: Record<string, unknown>;
  outputDir: string;
  hasRisk: boolean;
}

export async function mergeReport(input: MergeInput): Promise<ComplianceReport> {
  const { jobId, analyzerPath, scannerPath, fossologyStatus, outputDir, hasRisk } = input;
  await mkdir(outputDir, { recursive: true });

  const licenses: LicenseAssessment[] = normalizeLicenses(fossologyStatus);
  const risks: RiskSummary[] = buildRiskSummary(licenses, hasRisk);

  const unknownCount = licenses.filter((l) => l.riskFlags?.includes('unknown')).length;

  const report: ComplianceReport = {
    sbom: scannerPath,
    licenses,
    risks,
    coverage: {
      components: licenses.length,
      unknownLicenses: unknownCount || (hasRisk ? 1 : 0)
    },
    reportUrl: path.join(outputDir, 'report.html'),
    reportJsonUrl: path.join(outputDir, 'report.json')
  };

  await writeFile(report.reportJsonUrl as string, JSON.stringify(report, null, 2), 'utf-8');
  await writeFile(report.reportUrl as string, `<html><body><pre>${JSON.stringify(report, null, 2)}</pre></body></html>`, 'utf-8');

  return report;
}

function normalizeLicenses(fossologyStatus: Record<string, unknown>): LicenseAssessment[] {
  const raw = (fossologyStatus as any).licenses || [];
  return raw.map((item: any) => {
    const licenses = item.licenses
      ? item.licenses
      : item.license
        ? [{ id: item.license, confidence: item.confidence ?? 0 }]
        : [];
    const riskFlags: RiskFlag[] = item.riskFlags || [];
    return {
      componentId: item.componentId,
      licenses,
      riskFlags
    } as LicenseAssessment;
  });
}

function buildRiskSummary(licenses: LicenseAssessment[], hasRisk: boolean): RiskSummary[] {
  const summaries: RiskSummary[] = [];
  const unknownComponents = licenses
    .filter((l) => l.riskFlags?.includes('unknown'))
    .map((l) => l.componentId);
  if (unknownComponents.length > 0 || hasRisk) {
    summaries.push({ type: 'unknown', severity: 'high', components: unknownComponents.length ? unknownComponents : ['unspecified'] });
  }
  const incompatible = licenses
    .filter((l) => l.riskFlags?.includes('incompatible'))
    .map((l) => l.componentId);
  if (incompatible.length > 0) {
    summaries.push({ type: 'incompatible', severity: 'high', components: incompatible });
  }
  return summaries;
}
