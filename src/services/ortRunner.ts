import { access, copyFile, mkdir, readdir } from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { OrtConfig, ProjectInput } from '../models';
import { createLogger } from '../lib/logger';

const execFileAsync = promisify(execFile);
const logger = createLogger({ stage: 'ort_runner' });

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

  const integrationMode = config.integrationMode ?? (process.env.INTEGRATION_MODE as 'fixture' | 'live') ?? 'fixture';
  const ortOutputDir = path.resolve(config.outputDir ?? './out', 'ort');
  await mkdir(ortOutputDir, { recursive: true });

  const useFixtures = integrationMode !== 'live';

  if (useFixtures) {
    // Deterministic offline fixtures to satisfy tests and local runs without ORT installed.
    const analyzerFixture = path.resolve('tests/fixtures/analyzer.json');
    const scannerFixture = path.resolve('tests/fixtures/scanner.spdx.json');
    const analyzerPath = path.join(ortOutputDir, 'analyzer.json');
    const scannerPath = path.join(ortOutputDir, 'scanner.spdx.json');
    await Promise.all([
      copyFixture(analyzerFixture, analyzerPath),
      copyFixture(scannerFixture, scannerPath)
    ]);
    return { analyzerPath, scannerPath };
  }

  const ortCliPath = config.ortCliPath || process.env.ORT_CLI_PATH || 'ort';
  const timeoutMs = (config.timeoutSeconds ?? 300) * 1000;

  const analyzerPathCandidates = [
    'analyzer-result.json',
    'analyzer-result.yml',
    'analyzer-result.yaml',
    'analyzer-result.spdx.json'
  ];
  const scannerPathCandidates = [
    'scan-result.spdx.json',
    'scan-result.json',
    'scan-result.yml',
    'scan-result.yaml',
    'scanner.spdx.json'
  ];

  const runOrtCommand = async (args: string[]) => {
    const cmd = `${ortCliPath} ${args.join(' ')}`;
    logger.info('ort_exec', { event: 'ort_exec', cmd });
    try {
      return await execFileAsync(ortCliPath, args, {
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, JAVA_TOOL_OPTIONS: '-Djava.awt.headless=true' }
      });
    } catch (err: any) {
      logger.error('ort_exec_failed', { event: 'ort_exec_failed', cmd }, { stderr: err?.stderr, stdout: err?.stdout });
      throw err;
    }
  };

  const resolveOutput = async (candidates: string[]) => {
    const files = await readdir(ortOutputDir);
    const match = candidates.find((candidate) => files.includes(candidate));
    if (!match) {
      return undefined;
    }
    return path.join(ortOutputDir, match);
  };

  // Run ORT analyze
  await runOrtCommand(['analyze', '-i', input.localPath, '--output-dir', ortOutputDir]);

  // Locate analyzer result for scan input
  const analyzerResolvedPath = await resolveOutput(analyzerPathCandidates);
  if (!analyzerResolvedPath) {
    throw new Error('ORT_ANALYZE_OUTPUT_MISSING');
  }

  // Run ORT scan using analyzer output
  await runOrtCommand(['scan', '-i', analyzerResolvedPath, '--output-dir', ortOutputDir]);

  const analyzerPath = analyzerResolvedPath;
  const scannerPath = await resolveOutput(scannerPathCandidates);

  if (!analyzerPath || !scannerPath) {
    throw new Error('ORT_OUTPUT_MISSING');
  }

  return { analyzerPath, scannerPath };
}

async function copyFixture(src: string, dest: string) {
  await mkdir(path.dirname(dest), { recursive: true });
  await copyFile(src, dest);
}
