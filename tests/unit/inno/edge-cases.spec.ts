import fs from 'fs';
import path from 'path';
import { classifyExtractedFiles } from '@services/inno/classifier';

describe('classifier edge cases', () => {
  const tmpRoot = path.join(__dirname, '../../.tmp-edge-cases');

  beforeAll(() => {
    fs.mkdirSync(path.join(tmpRoot, 'a'), { recursive: true });
    fs.mkdirSync(path.join(tmpRoot, 'b'), { recursive: true });
    fs.writeFileSync(path.join(tmpRoot, 'a', 'duplicate.txt'), 'same contents');
    fs.writeFileSync(path.join(tmpRoot, 'b', 'duplicate.txt'), 'same contents');
    fs.writeFileSync(path.join(tmpRoot, 'unexpected.txt'), 'unexpected file');
  });

  afterAll(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('keeps duplicate filenames distinct by path/id', async () => {
    const results = await classifyExtractedFiles(tmpRoot);
    const dupes = results.filter((r) => r.installPath.endsWith('duplicate.txt'));
    expect(dupes).toHaveLength(2);
    const ids = new Set(dupes.map((r) => r.id));
    expect(ids.size).toBe(2);
  });

  it('flags unexpected files for manual review when allowlist is provided', async () => {
    const allowlist = new Set<string>(['a/duplicate.txt', 'b/duplicate.txt']);
    const results = await classifyExtractedFiles(tmpRoot, undefined, allowlist);
    const unexpected = results.find((r) => r.installPath === 'unexpected.txt');
    expect(unexpected?.statusMessage).toContain('unexpected');
  });
});
