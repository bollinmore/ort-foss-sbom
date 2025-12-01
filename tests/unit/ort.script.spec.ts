import { spawn } from 'child_process';
import fs from 'fs';
import fsPromises from 'fs/promises';
import os from 'os';
import path from 'path';

const repoRoot = path.resolve(__dirname, '../..');
const scriptPath = path.join(repoRoot, 'scripts', 'ort.sh');

const toPosix = (p: string) => p.replace(/\\/g, '/');

async function pathExists(target: string) {
  try {
    await fsPromises.access(target);
    return true;
  } catch {
    return false;
  }
}

async function runScript(args: string[], env?: NodeJS.ProcessEnv) {
  return await new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve) => {
    const child = spawn('bash', [toPosix(scriptPath), ...args], {
      cwd: repoRoot,
      env: { ...process.env, ...env }
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

describe('scripts/ort.sh', () => {
  const createEnvFile = async (content: string) => {
    const dir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'ort-env-'));
    const envFile = path.join(dir, '.env.test');
    await fsPromises.writeFile(envFile, content, 'utf8');
    return envFile;
  };

  it('runs analyze/scan/report via ORT CLI wrapper and emits SBOM files', async () => {
    const tempRoot = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'ort-script-'));
    const envFile = await createEnvFile('CUSTOM_ENV=from_env\nORT_LOG_LEVEL=info\n');
    const targetDir = await fsPromises.mkdtemp(path.join(tempRoot, 'scan-target-'));
    await fsPromises.writeFile(path.join(targetDir, 'README.md'), 'demo', 'utf8');

    const outputDir = toPosix(path.join(tempRoot, 'out'));
    const stubLog = toPosix(path.join(tempRoot, 'ort-cli.log'));
    const stubCli = toPosix(path.join(tempRoot, 'ort-cli.sh'));

    const stubScript = [
      '#!/usr/bin/env bash',
      'set -euo pipefail',
      `log_file="${stubLog}"`,
      'record() {',
      '  if [[ -n "${log_file}" ]]; then',
      '    echo "$*" >> "${log_file}"',
      '  fi',
      '}',
      '',
      'args=("$@")',
      'while [[ "$#" -gt 0 && ( "$1" == "--info" || "$1" == "--debug" || "$1" == "--stacktrace" ) ]]; do',
      '  shift',
      'done',
      '',
      'cmd="${1:-}"',
      'shift || true',
      'record "ENV:CUSTOM_ENV=${CUSTOM_ENV:-unset}"',
      'record "${cmd} $*"',
      '',
      'case "${cmd}" in',
      '  analyze)',
      '    while [[ "$#" -gt 1 && "$1" != "--output-dir" ]]; do shift; done',
      '    shift',
      '    out="$1"',
      '    mkdir -p "${out}"',
      '    echo "{}" > "${out}/analyzer-result.json"',
      '    ;;',
      '  scan)',
      '    while [[ "$#" -gt 1 && "$1" != "--output-dir" ]]; do shift; done',
      '    shift',
      '    out="$1"',
      '    echo "{}" > "${out}/scan-result.spdx.json"',
      '    ;;',
      '  report)',
      '    while [[ "$#" -gt 1 && "$1" != "--output-dir" ]]; do shift; done',
      '    shift',
      '    out="$1"',
      '    echo "{}" > "${out}/sbom.spdx.json"',
      '    echo "{}" > "${out}/sbom.cyclonedx.json"',
      '    ;;',
      '  *)',
      '    echo "unexpected command: ${cmd}" >&2',
      '    exit 1',
      '    ;;',
      'esac',
      ''
    ].join('\n');

    await fsPromises.writeFile(stubCli, stubScript, 'utf8');
    await fsPromises.chmod(stubCli, 0o755);

    const result = await runScript([toPosix(targetDir)], {
      ENV_FILE: toPosix(envFile),
      ORT_CLI_PATH: toPosix(stubCli),
      OUTPUT_DIR: toPosix(outputDir),
      STUB_LOG: stubLog
    });

    expect(result.code).toBe(0);
    expect(await pathExists(path.join(outputDir, 'sbom.spdx.json'))).toBe(true);
    expect(await pathExists(path.join(outputDir, 'sbom.cyclonedx.json'))).toBe(true);

    const logContent = await fsPromises.readFile(stubLog, 'utf8');
    const lines = logContent
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    expect(lines[0]).toContain('ENV:CUSTOM_ENV=from_env');
    expect(lines.some((line) => line.includes('analyze'))).toBe(true);
    expect(lines.some((line) => line.includes('scan'))).toBe(true);
    expect(lines.some((line) => line.includes('report'))).toBe(true);
  });

  it('fails fast when path is missing', async () => {
    const envFile = await createEnvFile('CUSTOM_ENV=from_env\n');
    const result = await runScript([], { ENV_FILE: envFile });
    expect(result.code).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toMatch(/Usage: scripts\/ort\.sh/);
  });

  it('errors when the target path does not exist', async () => {
    const envFile = await createEnvFile('CUSTOM_ENV=from_env\n');
    const missingPath = path.join(os.tmpdir(), 'does-not-exist-ort');
    const result = await runScript([toPosix(missingPath)], { ENV_FILE: envFile });
    expect(result.code).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toMatch(/Target path not found/);
  });
});
