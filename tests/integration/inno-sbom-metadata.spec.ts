import path from 'path';

describe.skip('Inno SBOM metadata-rich installer', () => {
  const fixtureDir = path.resolve(__dirname, '../fixtures/inno/metadata-rich');
  const installerPath = path.join(fixtureDir, 'Setup.exe'); // placeholder

  test('captures PE metadata for binaries', async () => {
    expect(installerPath).toBeTruthy();
    // TODO: Replace with real CLI invocation and assertions once fixture is available.
  });
});
