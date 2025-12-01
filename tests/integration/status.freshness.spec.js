"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const workflowOrchestrator_1 = require("../../src/services/workflowOrchestrator");
const status_1 = require("../../src/services/status");
describe('Status freshness', () => {
    it('returns stage and progress with timestamps for completed job', async () => {
        const { jobId } = await (0, workflowOrchestrator_1.orchestrateScan)({
            localPath: __dirname,
            config: { downloaderEnabled: false }
        });
        const res = (0, status_1.getStatus)(jobId);
        expect(res.status).toBe(200);
        expect(res.body.stage).toBe('completed');
        expect(res.body.progress?.percent).toBe(100);
        expect(res.body.completedAt).toBeDefined();
        expect(res.body.startedAt).toBeDefined();
    });
});
