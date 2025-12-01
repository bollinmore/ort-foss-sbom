"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const workflowOrchestrator_1 = require("../../src/services/workflowOrchestrator");
const status_1 = require("../../src/services/status");
const reportHandler_1 = require("../../src/services/api/reportHandler");
function mockReqRes(jobId) {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    return { req: { params: { jobId } }, res: { status }, json, status };
}
describe('Security/no-leak checks', () => {
    it('status/report responses do not leak tokens or secrets', async () => {
        process.env.FOSSOLOGY_TOKEN = 'SECRET_TOKEN';
        const { jobId } = await (0, workflowOrchestrator_1.orchestrateScan)({
            localPath: __dirname,
            config: { downloaderEnabled: false }
        });
        const statusRes = (0, status_1.getStatus)(jobId);
        expect(JSON.stringify(statusRes.body)).not.toContain('SECRET_TOKEN');
        const { req, res, json } = mockReqRes(jobId);
        await (0, reportHandler_1.reportHandler)(req, res);
        const body = json.mock.calls[0][0];
        expect(JSON.stringify(body)).not.toContain('SECRET_TOKEN');
        process.env.FOSSOLOGY_TOKEN = undefined;
    });
});
