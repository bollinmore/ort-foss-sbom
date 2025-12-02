import path from 'path';

describe.skip('Inno SBOM multi-arch/lang installer', () => {
  const fixtureDir = path.resolve(__dirname, '../fixtures/inno/multi-arch-lang');
  const installerPath = path.join(fixtureDir, 'Setup.exe'); // placeholder

  test('retains architecture and language annotations', async () => {
    expect(installerPath).toBeTruthy();
    // TODO: Replace with real CLI invocation once fixture exists.
  });
});
