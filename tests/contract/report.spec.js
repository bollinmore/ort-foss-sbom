"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const workflowOrchestrator_1 = require("../../src/services/workflowOrchestrator");
const reportHandler_1 = require("../../src/services/api/reportHandler");
function mockReqRes(jobId) {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    return {
        req: { params: { jobId } },
        res: { status },
        status,
        json
    };
}
describe('GET /report/:jobId contract (simulated)', () => {
    it('returns 404 when report not found', async () => {
        const { req, res } = mockReqRes('missing');
        await (0, reportHandler_1.reportHandler)(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
    });
    it('returns merged report URLs and summary for known job', async () => {
        const { jobId } = await (0, workflowOrchestrator_1.orchestrateScan)({
            localPath: __dirname,
            config: { downloaderEnabled: false }
        });
        const { req, res, json } = mockReqRes(jobId);
        await (0, reportHandler_1.reportHandler)(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalled();
        const body = json.mock.calls[0][0];
        expect(body.reportUrl).toBeDefined();
        expect(body.sbomUrl).toBeDefined();
        expect(body.exitCode).toBe(0);
    });
});
