import fs from 'fs';
import os from 'os';
import path from 'path';
import { emitSpdx } from '@lib/sbom/spdx-emitter';
import { SBOMEntry, LicenseEvidence } from '@models/inno/types';

describe('SPDX emitter', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spdx-emitter-'));

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('emits a valid SPDX document with evidence links and metadata hints', () => {
    const entries: SBOMEntry[] = [
      {
        fileId: 'file-1',
        path: 'bin/app.exe',
        checksum: 'abc123',
        fileType: 'executable',
        license: 'MIT',
        evidenceIds: ['e1'],
        classificationStatus: 'classified',
        architecture: 'x64',
        language: 'en-US'
      }
    ];

    const evidences: LicenseEvidence[] = [
      {
        id: 'e1',
        sourceFileId: 'file-1',
        evidenceType: 'license_file',
        confidence: 0.95,
        summary: 'License file detected'
      }
    ];

    const { outputPath, valid } = emitSpdx({
      documentName: 'test-doc',
      namespace: 'https://example.com/spdx/test-doc',
      outputDir: tmpDir,
      entries,
      evidences
    });

    expect(fs.existsSync(outputPath)).toBe(true);
    expect(valid).toBe(true);
    const json = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    expect(json.files[0].fileName).toBe('bin/app.exe');
    expect(json.hasExtractedLicensingInfos[0].name).toBe('e1');
  });
});
