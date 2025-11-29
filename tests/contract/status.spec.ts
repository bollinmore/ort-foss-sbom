import { orchestrateScan } from '../../src/services/workflowOrchestrator';
import { getStatus } from '../../src/services/status';

describe('GET /status/:jobId contract (simulated)', () => {
  it('returns 404 for unknown job', async () => {
    const res = getStatus('missing');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('surfaces upstream timeout/unreachable as retryable', async () => {
    const result = getStatus('upstream-fail');
    expect(result.status).toBe(200);
    expect(result.body.status).toBe('failed');
    expect(result.body.error).toBe('UPSTREAM_UNAVAILABLE');
  });

  it('returns stage progression and timestamps for known job', async () => {
    const { jobId } = await orchestrateScan({
      localPath: __dirname,
      config: { downloaderEnabled: false }
    });
    const res = getStatus(jobId);
    expect(res.status).toBe(200);
    expect(res.body.stage).toBe('completed');
    expect(res.body.startedAt).toBeDefined();
    expect(res.body.completedAt).toBeDefined();
    expect(res.body.progress?.percent).toBe(100);
  });
});
