import fs from 'fs';
import os from 'os';
import path from 'path';
import { emitCycloneDx } from '@lib/sbom/cyclonedx-emitter';
import { SBOMEntry } from '@models/inno/types';

describe('CycloneDX emitter', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cyclonedx-emitter-'));

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('emits a valid CycloneDX BOM with arch/lang properties', () => {
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

    const { outputPath, valid } = emitCycloneDx({
      bomName: 'test-bom',
      outputDir: tmpDir,
      entries
    });

    expect(fs.existsSync(outputPath)).toBe(true);
    expect(valid).toBe(true);
    const json = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    expect(json.components[0].name).toBe('bin/app.exe');
    expect(json.components[0].properties).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'architecture', value: 'x64' }),
        expect.objectContaining({ name: 'language', value: 'en-US' })
      ])
    );
  });
});
