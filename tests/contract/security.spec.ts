import { orchestrateScan } from '../../src/services/workflowOrchestrator';
import { getStatus } from '../../src/services/status';
import { reportHandler } from '../../src/services/api/reportHandler';

function mockReqRes(jobId: string) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  return { req: { params: { jobId } } as any, res: { status } as any, json, status };
}

describe('Security/no-leak checks', () => {
  it('status/report responses do not leak tokens or secrets', async () => {
    process.env.FOSSOLOGY_TOKEN = 'SECRET_TOKEN';
    const { jobId } = await orchestrateScan({
      localPath: __dirname,
      config: { downloaderEnabled: false }
    });
    const statusRes = getStatus(jobId);
    expect(JSON.stringify(statusRes.body)).not.toContain('SECRET_TOKEN');

    const { req, res, json } = mockReqRes(jobId);
    await reportHandler(req as any, res as any);
    const body = json.mock.calls[0][0];
    expect(JSON.stringify(body)).not.toContain('SECRET_TOKEN');
    process.env.FOSSOLOGY_TOKEN = undefined;
  });
});
