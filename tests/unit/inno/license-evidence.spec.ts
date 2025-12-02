import { collectLicenseEvidence } from '@services/inno/license-evidence';

describe('license evidence heuristics', () => {
  it('detects README and LICENSE files with confidence levels', () => {
    const map = new Map<string, string>([
      ['docs/README.txt', 'file-1'],
      ['LICENSE', 'file-2'],
      ['bin/app.exe', 'file-3']
    ]);

    const evidences = collectLicenseEvidence(map);
    const byId = Object.fromEntries(evidences.map((e) => [e.sourceFileId, e]));

    expect(byId['file-1']).toMatchObject({
      evidenceType: 'readme',
      confidence: expect.any(Number)
    });
    expect(byId['file-2']).toMatchObject({
      evidenceType: 'license_file',
      confidence: expect.any(Number)
    });
    expect(byId['file-3']).toBeUndefined();
  });
});
