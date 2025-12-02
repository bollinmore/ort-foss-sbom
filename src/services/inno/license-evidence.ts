import path from 'path';
import fs from 'fs';
import { LicenseEvidence } from '../../models/inno/types';
import { normalizeInstallPath } from '../../lib/sbom/file-utils';

let evidenceCounter = 0;

function nextId(): string {
  evidenceCounter += 1;
  return `evidence-${evidenceCounter}`;
}

function detectLicenseId(contents: string): string | undefined {
  const text = contents.toLowerCase();
  const checks: Array<[RegExp, string]> = [
    [/apache license,? version 2\.0/, 'Apache-2.0'],
    [/mit license/, 'MIT'],
    [/bsd 3[- ]clause/, 'BSD-3-Clause'],
    [/bsd 2[- ]clause/, 'BSD-2-Clause'],
    [/gnu (lesser )?general public license.*version 3/, 'GPL-3.0-only'],
    [/gnu (lesser )?general public license.*version 2\.1/, 'GPL-2.1-only'],
    [/gnu lesser general public license.*version 3/, 'LGPL-3.0-only'],
    [/mozilla public license.*2\.0/, 'MPL-2.0'],
    [/eclipse public license.*2\.0/, 'EPL-2.0'],
    [/the unlicense/, 'Unlicense'],
    [/cc0-1\.0|creative commons zero 1\.0/, 'CC0-1.0'],
    [/cc by 4\.0|creative commons attribution 4\.0/, 'CC-BY-4.0'],
    [/isc license/, 'ISC']
  ];
  for (const [pattern, spdxId] of checks) {
    if (pattern.test(text)) return spdxId;
  }
  return undefined;
}

interface EvidenceInput {
  installPath: string;
  fileId: string;
  extractedPath: string;
}

export function collectLicenseEvidence(files: EvidenceInput[]): LicenseEvidence[] {
  const evidences: LicenseEvidence[] = [];

  for (const file of files) {
    const normalized = normalizeInstallPath(file.installPath);
    const base = path.basename(normalized).toLowerCase();
    const canRead = fs.existsSync(file.extractedPath);
    const fileText = canRead && fs.statSync(file.extractedPath).size < 256_000 ? fs.readFileSync(file.extractedPath, 'utf8') : '';
    const detectedId = fileText ? detectLicenseId(fileText) : undefined;

    if (base.startsWith('readme')) {
      evidences.push({
        id: nextId(),
        sourceFileId: file.fileId,
        evidenceType: 'readme',
        confidence: 0.9,
        summary: 'README file detected as license evidence',
        extractedText: fileText ? fileText.slice(0, 2000) : undefined
      });
    } else if (base.includes('license') || base === 'copying' || base === 'licence') {
      evidences.push({
        id: nextId(),
        sourceFileId: file.fileId,
        evidenceType: 'license_file',
        confidence: detectedId ? 0.99 : 0.95,
        summary: detectedId ? `License file detected (${detectedId})` : 'License file detected',
        licenseSpdxId: detectedId,
        extractedText: fileText ? fileText.slice(0, 2000) : undefined
      });
    }
  }

  return evidences;
}
