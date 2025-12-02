import fs from 'fs';
import path from 'path';
import { createStageLogger } from '@lib/logger';
import { ExtractResult, ExtractorOptions } from './extractor';
import { InnounpExtractor } from './extractor-innounp';
import { InnoextractExtractor } from './extractor-innoextract';
import { ExtractionError, ExtractionWorkspace } from '@models/inno/types';

const logger = createStageLogger('extracting');

function getWorkspaceDir(outputDir: string): string {
  return path.join(outputDir, 'workspace');
}

async function selectExtractor(): Promise<{ extractor: InnounpExtractor | InnoextractExtractor; fallback?: true }> {
  const primary = new InnounpExtractor();
  if (await primary.isAvailable()) {
    return { extractor: primary };
  }
  const fallback = new InnoextractExtractor();
  if (await fallback.isAvailable()) {
    return { extractor: fallback, fallback: true };
  }
  throw new Error('No extractor available (innounp or innoextract not found on PATH)');
}

export async function runExtraction(installerPath: string, outputDir: string, timeoutSeconds?: number): Promise<{
  workspace: ExtractionWorkspace;
  extractedFiles: string[];
  extractorLog?: { stdout?: string; stderr?: string };
}> {
  const workdir = getWorkspaceDir(outputDir);
  fs.mkdirSync(outputDir, { recursive: true });

  let workspace: ExtractionWorkspace = {
    workdir,
    extractor: 'innounp',
    status: 'pending',
    errors: []
  };

  try {
    const { extractor, fallback } = await selectExtractor();
    workspace = { ...workspace, extractor: extractor.tool, status: 'extracting' };
    logger.info(`Using extractor ${extractor.tool}`, { code: fallback ? 'FALLBACK_EXTRACTOR' : 'PRIMARY_EXTRACTOR' });

    const result = await extractor.extract({ installerPath, workdir, timeoutSeconds } as ExtractorOptions);
    return {
      workspace: result.workspace,
      extractedFiles: result.extractedFiles,
      extractorLog: { stdout: result.stdout, stderr: result.stderr }
    };
  } catch (error) {
    const mapped: ExtractionError = (error as any)?.code
      ? (error as ExtractionError)
      : {
          code: (error as any)?.timeout ? 'TIMEOUT' : 'UNKNOWN',
          message: (error as Error)?.message ?? 'Unknown extraction error'
        };
    if ((error as any)?.timeout) {
      mapped.code = 'TIMEOUT';
      mapped.message = 'Extraction timed out';
    }
    workspace = { ...workspace, status: 'failed', errors: [mapped] };
    logger.error('Extraction failed', { code: mapped.code, data: mapped });
    throw Object.assign(new Error(mapped.message), { extraction: workspace });
  }
}
