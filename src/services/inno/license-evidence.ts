import path from 'path';
import { LicenseEvidence } from '../../models/inno/types';
import { normalizeInstallPath } from '../../lib/sbom/file-utils';

let evidenceCounter = 0;

function nextId(): string {
  evidenceCounter += 1;
  return `evidence-${evidenceCounter}`;
}

export function collectLicenseEvidence(fileIdsByPath: Map<string, string>): LicenseEvidence[] {
  const evidences: LicenseEvidence[] = [];

  for (const [installPath, fileId] of fileIdsByPath.entries()) {
    const normalized = normalizeInstallPath(installPath);
    const base = path.basename(normalized).toLowerCase();

    if (base.startsWith('readme')) {
      evidences.push({
        id: nextId(),
        sourceFileId: fileId,
        evidenceType: 'readme',
        confidence: 0.9,
        summary: 'README file detected as license evidence'
      });
    } else if (base.includes('license') || base === 'copying' || base === 'licence') {
      evidences.push({
        id: nextId(),
        sourceFileId: fileId,
        evidenceType: 'license_file',
        confidence: 0.95,
        summary: 'License file detected'
      });
    }
  }

  return evidences;
}
