import { Request, Response } from 'express';
import { orchestrateScan } from '@services/workflowOrchestrator';

export async function scanHandler(req: Request, res: Response) {
  try {
    const { localPath, config } = req.body || {};
    const { jobId, report } = await orchestrateScan({
      localPath,
      config: { downloaderEnabled: false, ...config }
    });
    return res.status(202).json({ jobId, status: 'queued', report: { sbom: report.sbom } });
  } catch (err) {
    const code = (err as Error).message === 'INVALID_PATH' ? 'INVALID_PATH' : 'SCAN_FAILED';
    return res.status(400).json({ error: code });
  }
}
