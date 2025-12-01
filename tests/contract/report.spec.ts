import { orchestrateScan } from '../../src/services/workflowOrchestrator';
import { reportHandler } from '../../src/services/api/reportHandler';

function mockReqRes(jobId: string) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  return {
    req: { params: { jobId } } as any,
    res: { status } as any,
    status,
    json
  };
}

describe('GET /report/:jobId contract (simulated)', () => {
  it('returns 404 when report not found', async () => {
    const { req, res } = mockReqRes('missing');
    await reportHandler(req as any, res as any);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns merged report URLs and summary for known job', async () => {
    const { jobId } = await orchestrateScan({
      localPath: __dirname,
      config: { downloaderEnabled: false }
    });
    const { req, res, json } = mockReqRes(jobId);
    await reportHandler(req as any, res as any);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalled();
    const body = json.mock.calls[0][0];
    expect(body.reportUrl).toBeDefined();
    expect(body.sbomUrl).toBeDefined();
    expect(body.exitCode).toBe(0);
  });
});
