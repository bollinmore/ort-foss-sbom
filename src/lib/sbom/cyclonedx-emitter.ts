import fs from 'fs';
import path from 'path';
import { SBOMEntry } from '../../models/inno/types';
import { validateCycloneDx } from './validators';

export interface CycloneDxEmitOptions {
  bomName: string;
  outputDir: string;
  entries: SBOMEntry[];
}

export function emitCycloneDx(options: CycloneDxEmitOptions): { outputPath: string; valid: boolean } {
  const { bomName, outputDir, entries } = options;
  const components = entries.map((entry) => ({
    type: 'file',
    name: entry.path,
    version: '1.0.0',
    hashes: [{ alg: 'SHA-256', content: entry.checksum }],
    licenses: entry.license === 'unknown' ? [] : [{ license: { id: entry.license } }],
    evidenceIds: entry.evidenceIds,
    properties: [
      { name: 'architecture', value: entry.architecture ?? 'unknown' },
      { name: 'language', value: entry.language ?? 'unknown' }
    ]
  }));

  const bom = {
    bomFormat: 'CycloneDX',
    specVersion: '1.6',
    version: 1,
    metadata: { component: { name: bomName, version: '1.0.0' } },
    components
  };

  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'sbom.cyclonedx.json');
  fs.writeFileSync(outputPath, JSON.stringify(bom, null, 2));

  const valid = validateCycloneDx(bom);
  return { outputPath, valid };
}
