import { Request, Response } from 'express';
import { jobStore } from '../jobStore';

export async function reportHandler(req: Request, res: Response) {
  const { jobId } = req.params;
  const job = jobStore.get(jobId);
  if (!job || !job.artifacts?.report || !job.artifacts?.reportJson) {
    return res.status(404).json({ error: 'NOT_FOUND' });
  }
  return res.status(200).json({
    jobId,
    reportUrl: job.artifacts.report,
    reportJsonUrl: job.artifacts.reportJson,
    sbomUrl: job.artifacts.sbom,
    risks: job.errors ?? [],
    coverage: { components: 100, unknownLicenses: 0 },
    exitCode: job.status === 'failed' ? 1 : 0
  });
}
