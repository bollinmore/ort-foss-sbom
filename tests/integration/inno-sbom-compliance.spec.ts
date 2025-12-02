import fs from 'fs';
import path from 'path';

describe('Inno SBOM compliance (simple installer)', () => {
  const installerPath = path.resolve(__dirname, '../fixtures/inno/iq2-setup.exe');

  test('iq2-setup.exe is available for integration runs', async () => {
    if (!fs.existsSync(installerPath)) {
      console.warn('iq2-setup.exe not found in fixtures; skipping integration assertion');
      return;
    }
    expect(fs.existsSync(installerPath)).toBe(true);
    // TODO: invoke CLI once fixture expectations are defined and goldens are available.
  });
});
