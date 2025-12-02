import fs from 'fs';
import path from 'path';

describe.skip('Inno SBOM compliance (simple installer)', () => {
  const fixtureDir = path.resolve(__dirname, '../fixtures/inno/simple');
  const installerPath = path.join(fixtureDir, 'Setup.exe'); // placeholder, replace when fixture available

  test('produces SPDX and CycloneDX with full coverage and evidence links', async () => {
    // TODO: replace with real invocation once installer fixture is added.
    expect(fs.existsSync(installerPath)).toBe(true);
    // const result = await runCli(installerPath, ...);
    // expect(result.coverage.extracted).toBe(100);
    // expect(result.coverage.classified).toBe(100);
    // expect(result.sbom.spdxPath).toBeDefined();
    // expect(result.sbom.cyclonedxPath).toBeDefined();
  });
});
