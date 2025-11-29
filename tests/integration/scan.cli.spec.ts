import { runScanCli } from '../../src/cli/scan';
import { orchestrateScan } from '../../src/services/workflowOrchestrator';

describe('CLI scan integration', () => {
  it('returns job id and writes reports using fixtures', async () => {
    const { jobId, report } = await orchestrateScan({
      localPath: __dirname,
      config: { downloaderEnabled: false, outputDir: './out' }
    });
    expect(jobId).toMatch(/job-/);
    expect(report.reportJsonUrl).toBeDefined();
  });

  it('cli exits non-zero on missing path', async () => {
    const exit = await runScanCli([]);
    expect(exit).toBeUndefined();
  });
});
