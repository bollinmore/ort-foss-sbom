import path from 'path';

describe.skip('Inno SBOM corrupted installer', () => {
  const fixtureDir = path.resolve(__dirname, '../fixtures/inno/corrupted');
  const installerPath = path.join(fixtureDir, 'Setup.exe'); // placeholder

  test('fails with explicit failure code and error detail', async () => {
    expect(installerPath).toBeTruthy();
    // TODO: invoke CLI once corrupted fixture is available and assert exit code 3 with actionable error.
  });
});
