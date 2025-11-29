import { access } from 'fs/promises';
import path from 'path';
import { OrtConfig, ProjectInput } from '../models';

export interface OrtScanOutput {
  analyzerPath: string;
  scannerPath: string;
}

export async function runOrtScan(input: ProjectInput): Promise<OrtScanOutput> {
  if (!input.localPath) {
    throw new Error('INVALID_PATH');
  }
  // Ensure path exists and is readable; reject early otherwise.
  await access(input.localPath);

  const config: OrtConfig = {
    downloaderEnabled: false,
    ...input.config
  };

  if (config.downloaderEnabled) {
    throw new Error('DOWNLOADER_DISABLED');
  }

  // For now, point to offline fixtures. In real flow, this would shell out to ORT CLI.
  const analyzerPath = path.resolve('tests/fixtures/analyzer.json');
  const scannerPath = path.resolve('tests/fixtures/scanner.spdx.json');

  return { analyzerPath, scannerPath };
}
