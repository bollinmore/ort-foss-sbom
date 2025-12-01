import { orchestrateScan } from '../../src/services/workflowOrchestrator';
import { getStatus } from '../../src/services/status';

describe('Status freshness', () => {
  it('returns stage and progress with timestamps for completed job', async () => {
    const { jobId } = await orchestrateScan({
      localPath: __dirname,
      config: { downloaderEnabled: false }
    });
    const res = getStatus(jobId);
    expect(res.status).toBe(200);
    expect(res.body.stage).toBe('completed');
    expect(res.body.progress?.percent).toBe(100);
    expect(res.body.completedAt).toBeDefined();
    expect(res.body.startedAt).toBeDefined();
  });
});
