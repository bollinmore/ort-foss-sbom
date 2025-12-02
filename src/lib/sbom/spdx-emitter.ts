import fs from 'fs';
import path from 'path';
import { SBOMEntry, LicenseEvidence } from '@models/inno/types';
import { validateSpdx } from './validators';

export interface SpdxEmitOptions {
  documentName: string;
  namespace: string;
  outputDir: string;
  entries: SBOMEntry[];
  evidences: LicenseEvidence[];
}

export function emitSpdx(options: SpdxEmitOptions): { outputPath: string; valid: boolean } {
  const { documentName, namespace, outputDir, entries, evidences } = options;
  const files = entries.map((entry) => ({
    fileName: entry.path,
    checksums: [{ algorithm: 'SHA256', checksumValue: entry.checksum }],
    licenseConcluded: entry.license,
    fileTypes: [entry.fileType],
    annotations: entry.evidenceIds.map((id) => ({ annotationType: 'OTHER', annotationDate: new Date().toISOString(), annotator: id })),
    comment: JSON.stringify({
      architecture: entry.architecture,
      language: entry.language
    })
  }));

  const doc = {
    spdxVersion: 'SPDX-2.3',
    dataLicense: 'CC0-1.0',
    documentName,
    documentNamespace: namespace,
    files,
    hasExtractedLicensingInfos: evidences.map((e) => ({
      name: e.id,
      extractedText: e.summary
    }))
  };

  const outputPath = path.join(outputDir, 'sbom.spdx.json');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(doc, null, 2));

  const valid = validateSpdx(doc);
  return { outputPath, valid };
}
