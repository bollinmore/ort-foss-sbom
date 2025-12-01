"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scan_1 = require("../../src/cli/scan");
const workflowOrchestrator_1 = require("../../src/services/workflowOrchestrator");
describe('CI exit codes and artifacts on risk breach', () => {
    it('cli exits non-zero when risk is simulated and artifacts exist', async () => {
        process.env.SIMULATE_RISK = '1';
        await (0, scan_1.runScanCli)([__dirname]);
        expect(process.exitCode).toBe(1);
        process.env.SIMULATE_RISK = undefined;
    });
    it('reports coverage/risks when simulateRisk is enabled', async () => {
        const { report } = await (0, workflowOrchestrator_1.orchestrateScan)({
            localPath: __dirname,
            config: { downloaderEnabled: false, simulateRisk: true, outputDir: './out' }
        });
        expect(report.risks.length).toBeGreaterThan(0);
        expect(report.coverage.unknownLicenses).toBeGreaterThan(0);
    });
});
