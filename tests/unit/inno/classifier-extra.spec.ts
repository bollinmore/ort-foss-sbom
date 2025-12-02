import { classifyExtractedFiles } from '@services/inno/classifier';
import fs from 'fs';
import path from 'path';

describe('classifier unexpected files', () => {
  const tmpRoot = path.join(__dirname, '../../.tmp-classifier');

  beforeAll(() => {
    fs.mkdirSync(tmpRoot, { recursive: true });
    fs.writeFileSync(path.join(tmpRoot, 'expected.txt'), 'ok');
    fs.writeFileSync(path.join(tmpRoot, 'extra.bin'), 'unexpected');
  });

  afterAll(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('flags files not in expected allowlist', async () => {
    const expectedPaths = new Set<string>(['expected.txt']);
    const results = await classifyExtractedFiles(tmpRoot, undefined, expectedPaths);
    const unexpected = results.find((r) => r.installPath === 'extra.bin');
    expect(unexpected?.status).toBe('ok');
    expect(unexpected?.statusMessage).toContain('unexpected');
    const expected = results.find((r) => r.installPath === 'expected.txt');
    expect(expected?.statusMessage).toBeUndefined();
  });
});
