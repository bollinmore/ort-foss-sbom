import fs from 'fs';
import path from 'path';
import os from 'os';
import { collectLicenseEvidence } from '@services/inno/license-evidence';

describe('license evidence heuristics', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'license-evidence-'));

  it('detects README and LICENSE files with confidence levels', () => {
    const readmePath = path.join(tmpDir, 'README.txt');
    const licensePath = path.join(tmpDir, 'LICENSE');
    fs.writeFileSync(readmePath, 'Readme contents');
    fs.writeFileSync(licensePath, 'Apache License, Version 2.0');

    const files = [
      { installPath: 'docs/README.txt', fileId: 'file-1', extractedPath: readmePath },
      { installPath: 'LICENSE', fileId: 'file-2', extractedPath: licensePath },
      { installPath: 'bin/app.exe', fileId: 'file-3', extractedPath: path.join(tmpDir, 'app.exe') }
    ];

    const evidences = collectLicenseEvidence(files);
    const byId = Object.fromEntries(evidences.map((e) => [e.sourceFileId, e]));

    expect(byId['file-1']).toMatchObject({
      evidenceType: 'readme',
      confidence: expect.any(Number)
    });
    expect(byId['file-2']).toMatchObject({
      evidenceType: 'license_file',
      confidence: expect.any(Number),
      licenseSpdxId: 'Apache-2.0'
    });
    expect(byId['file-3']).toBeUndefined();
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
