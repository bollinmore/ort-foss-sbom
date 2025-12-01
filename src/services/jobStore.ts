import { ScanJob, JobStatus } from '../models';

type Stage = 'queued' | 'analyze' | 'scan' | 'upload' | 'license_review' | 'completed' | 'failed';

class JobStore {
  private jobs = new Map<string, ScanJob>();

  create(jobId: string): ScanJob {
    const now = new Date().toISOString();
    const job: ScanJob = {
      jobId,
      status: 'queued',
      stage: 'queued',
      startedAt: now,
      completedAt: null,
      progressPercent: 0
    };
    this.jobs.set(jobId, job);
    return job;
  }

  update(jobId: string, status: JobStatus, stage: Stage, progressPercent?: number, error?: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    job.status = status;
    job.stage = stage;
    job.progressPercent = progressPercent ?? job.progressPercent;
    if (error) {
      job.errors = [...(job.errors ?? []), error];
    }
    if (status === 'completed' || status === 'failed') {
      job.completedAt = new Date().toISOString();
      job.progressPercent = 100;
    }
    this.jobs.set(jobId, job);
  }

  setArtifacts(jobId: string, artifacts: ScanJob['artifacts']) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    job.artifacts = artifacts;
    this.jobs.set(jobId, job);
  }

  get(jobId: string): ScanJob | undefined {
    return this.jobs.get(jobId);
  }
}

export const jobStore = new JobStore();
