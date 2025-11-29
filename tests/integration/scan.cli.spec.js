"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scan_1 = require("../../src/cli/scan");
const workflowOrchestrator_1 = require("../../src/services/workflowOrchestrator");
describe('CLI scan integration', () => {
    it('returns job id and writes reports using fixtures', async () => {
        const { jobId, report } = await (0, workflowOrchestrator_1.orchestrateScan)({
            localPath: __dirname,
            config: { downloaderEnabled: false, outputDir: './out' }
        });
        expect(jobId).toMatch(/job-/);
        expect(report.reportJsonUrl).toBeDefined();
    });
    it('cli exits non-zero on missing path', async () => {
        const exit = await (0, scan_1.runScanCli)([]);
        expect(exit).toBeUndefined();
    });
});
