#!/usr/bin/env node
import { orchestrateScan } from '../services/workflowOrchestrator';
import { createLogger } from '../lib/logger';
import path from 'path';

const logger = createLogger({ stage: 'cli', event: 'scan' });

export async function runScanCli(argv = process.argv.slice(2)) {
  const [localPath] = argv;
  if (!localPath) {
    logger.error('missing path', { code: 'INVALID_PATH' });
    process.exitCode = 1;
    return;
  }

  try {
    const { jobId, report } = await orchestrateScan({
      localPath: path.resolve(localPath),
      config: { downloaderEnabled: false }
    });
    logger.info('scan_completed', { jobId, event: 'scan_completed', data: { report } });
  } catch (err) {
    logger.error('scan_failed', { code: (err as Error).message });
    process.exitCode = 1;
  }
}

if (require.main === module) {
  void runScanCli();
}
