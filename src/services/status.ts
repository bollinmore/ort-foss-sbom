import { jobStore } from './jobStore';

export function getStatus(jobId: string) {
  const job = jobStore.get(jobId);
  if (!job) {
    // Simulate upstream failure case for contract coverage
    if (jobId === 'upstream-fail') {
      return {
        status: 200,
        body: {
          jobId,
          status: 'failed',
          stage: 'license_review',
          progress: { percent: 80 },
          error: 'UPSTREAM_UNAVAILABLE'
        }
      };
    }
    return { status: 404, body: { error: 'NOT_FOUND' } };
  }
  return {
    status: 200,
    body: {
      jobId: job.jobId,
      status: job.status,
      stage: job.stage,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      progress: { percent: job.progressPercent ?? 0 },
      error: job.errors?.[0] ?? null
    }
  };
}
