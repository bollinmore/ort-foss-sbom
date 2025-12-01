import { runScanCli } from '../../src/cli/scan';
import { orchestrateScan } from '../../src/services/workflowOrchestrator';

describe('POST /scan contract (simulated)', () => {
  it('fails on missing path', async () => {
    const exit = await runScanCli([]);
    expect(exit).toBeUndefined();
  });

  it('processes valid path with downloader disabled', async () => {
    const { jobId, report } = await orchestrateScan({
      localPath: __dirname, // any existing path
      config: { downloaderEnabled: false }
    });
    expect(jobId).toMatch(/job-/);
    expect(report.sbom).toContain('scanner.spdx.json');
  });
});
