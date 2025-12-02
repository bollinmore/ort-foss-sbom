import path from 'path';

describe.skip('Inno SBOM unsupported compression', () => {
  const fixtureDir = path.resolve(__dirname, '../fixtures/inno/unsupported');
  const installerPath = path.join(fixtureDir, 'Setup.exe'); // placeholder

  test('fails fast on unsupported compression/missing volumes', async () => {
    expect(installerPath).toBeTruthy();
    // TODO: invoke CLI with unsupported installer and assert exit code 3 and error payload.
  });
});
