import path from 'path';

describe.skip('Inno SBOM CLI contract', () => {
  const cliPath = path.resolve(__dirname, '../../src/cli/inno-sbom.ts');

  test('requires installer and output dir flags (exit 2)', async () => {
    expect(cliPath).toBeTruthy();
    // TODO: spawn CLI and assert exit code 2 once test harness and fixtures are ready.
  });
});
