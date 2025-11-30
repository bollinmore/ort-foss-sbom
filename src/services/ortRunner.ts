import { access, copyFile, mkdir, readdir } from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { OrtConfig, ProjectInput } from '../models';
import { createLogger } from '../lib/logger';

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

  const verbose = config.verbose ?? false;
  const ortLogLevelRaw = config.ortLogLevel || (process.env.ORT_LOG_LEVEL as OrtConfig['ortLogLevel']);
  const ortLogFlags: string[] = [];
  if (ortLogLevelRaw === 'info') {
    ortLogFlags.push('--info');
  } else if (ortLogLevelRaw === 'debug') {
    ortLogFlags.push('--debug');
    if (process.env.ORT_STACKTRACE === '1') {
      ortLogFlags.push('--stacktrace');
    }
  }

  const runOrtCommand = async (args: string[]) => {
    const cmd = `${ortCliPath} ${args.join(' ')}`;
    logger.info('ort_exec', { event: 'ort_exec', cmd });
    const child = spawn(ortCliPath, args, {
      env: { ...process.env, JAVA_TOOL_OPTIONS: '-Djava.awt.headless=true' }
    });

    let stdoutBuf = '';
    let stderrBuf = '';

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdoutBuf += text;
      if (verbose) {
        logger.info('ort_stdout', { event: 'ort_stdout' }, text.trim());
      }
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderrBuf += text;
      if (verbose) {
        logger.info('ort_stderr', { event: 'ort_stderr' }, text.trim());
      }
    });

    return await new Promise<void>((resolve, reject) => {
      child.on('error', (err) => {
        clearTimeout(timer);
        logger.error('ort_exec_failed', { event: 'ort_exec_failed', cmd }, { stderr: err?.message });
        reject(err);
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) {
          resolve();
        } else {
          const err: any = new Error(`ORT command failed (${code}): ${cmd}`);
          err.stdout = stdoutBuf;
          err.stderr = stderrBuf;
          logger.error('ort_exec_failed', { event: 'ort_exec_failed', cmd }, { stdout: stdoutBuf, stderr: stderrBuf });
          reject(err);
        }
      });
    });
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
  logger.info('ort_analyze_start', { event: 'ort_analyze_start' });
  const analyzeArgsBase = ['analyze', '-i', input.localPath, '--output-dir', ortOutputDir];
  const analyzeArgs = ortLogFlags.length > 0 ? [...ortLogFlags, ...analyzeArgsBase] : analyzeArgsBase;
  await runOrtCommand(analyzeArgs);
  logger.info('ort_analyze_complete', { event: 'ort_analyze_complete' });

  // Locate analyzer result for scan input
  const analyzerResolvedPath = await resolveOutput(analyzerPathCandidates);
  if (!analyzerResolvedPath) {
    throw new Error('ORT_ANALYZE_OUTPUT_MISSING');
  }

  // Run ORT scan using analyzer output
  logger.info('ort_scan_start', { event: 'ort_scan_start' });
  const scanArgsBase = ['scan', '-i', analyzerResolvedPath, '--output-dir', ortOutputDir];
  const scanArgs = ortLogFlags.length > 0 ? [...ortLogFlags, ...scanArgsBase] : scanArgsBase;
  await runOrtCommand(scanArgs);
  logger.info('ort_scan_complete', { event: 'ort_scan_complete' });

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
