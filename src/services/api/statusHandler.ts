import { Request, Response } from 'express';
import { getStatus } from '../status';

export async function statusHandler(req: Request, res: Response) {
  const { jobId } = req.params;
  const result = getStatus(jobId);
  return res.status(result.status).json(result.body);
}
