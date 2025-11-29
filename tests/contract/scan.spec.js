"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scan_1 = require("../../src/cli/scan");
const workflowOrchestrator_1 = require("../../src/services/workflowOrchestrator");
describe('POST /scan contract (simulated)', () => {
    it('fails on missing path', async () => {
        const exit = await (0, scan_1.runScanCli)([]);
        expect(exit).toBeUndefined();
    });
    it('processes valid path with downloader disabled', async () => {
        const { jobId, report } = await (0, workflowOrchestrator_1.orchestrateScan)({
            localPath: __dirname, // any existing path
            config: { downloaderEnabled: false }
        });
        expect(jobId).toMatch(/job-/);
        expect(report.sbom).toContain('scanner.spdx.json');
    });
});
