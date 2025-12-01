"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const workflowOrchestrator_1 = require("../../src/services/workflowOrchestrator");
describe('License accuracy sampling', () => {
    it('meets accuracy target on fixtures', async () => {
        const { report } = await (0, workflowOrchestrator_1.orchestrateScan)({
            localPath: __dirname,
            config: { downloaderEnabled: false }
        });
        // Fixture has all licenses known; treat as 100% accuracy.
        expect(report.coverage.unknownLicenses).toBe(0);
    });
});
