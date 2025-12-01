import { runScanCli } from '../../src/cli/scan';
import { orchestrateScan } from '../../src/services/workflowOrchestrator';

describe('CI exit codes and artifacts on risk breach', () => {
  it('cli exits non-zero when risk is simulated and artifacts exist', async () => {
    process.env.SIMULATE_RISK = '1';
    await runScanCli([__dirname]);
    expect(process.exitCode).toBe(1);
    process.env.SIMULATE_RISK = undefined;
  });

  it('reports coverage/risks when simulateRisk is enabled', async () => {
    const { report } = await orchestrateScan({
      localPath: __dirname,
      config: { downloaderEnabled: false, simulateRisk: true, outputDir: './out' }
    });
    expect(report.risks.length).toBeGreaterThan(0);
    expect(report.coverage.unknownLicenses).toBeGreaterThan(0);
  });
});
