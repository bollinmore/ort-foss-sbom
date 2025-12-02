import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ExtractResult, Extractor, ExtractorOptions } from './extractor';
import { ExtractionError } from '@models/inno/types';

function findBinary(): string | null {
  const isWin = process.platform === 'win32';
  const candidates = [
    process.env.INNOEXTRACT_PATH,
    process.env.INNOEXTRACT_BIN,
    // Ship .exe for Windows; on *nix require a native binary (e.g., apt/brew installed).
    isWin ? path.resolve(process.cwd(), 'bin', 'innoextract.exe') : null,
    isWin ? path.resolve(process.cwd(), 'innoextract.exe') : null,
    isWin ? path.resolve(__dirname, '../../../bin/innoextract.exe') : null,
    isWin ? path.resolve(__dirname, '../../../../bin/innoextract.exe') : null,
    'innoextract'
  ].filter(Boolean) as string[];
  const command = process.platform === 'win32' ? 'where' : 'which';
  for (const candidate of candidates) {
    if (candidate.includes(path.sep) && fs.existsSync(candidate)) {
      return candidate;
    }
    const probe = spawnSync(command, [candidate], { stdio: 'pipe', encoding: 'utf-8' });
    if (probe.status === 0) {
      const found = probe.stdout.split(/\r?\n/).find(Boolean);
      if (found && fs.existsSync(found.trim())) {
        return found.trim();
      }
    }
  }
  return null;
}

function isToolAvailable(): boolean {
  return Boolean(findBinary());
}

function collectFiles(root: string): string[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else {
        files.push(full);
      }
    }
  };
  walk(root);
  return files;
}

export class InnoextractExtractor implements Extractor {
  tool = 'innoextract' as const;
  private toolPath: string | null = null;

  private resolveToolPath(): string {
    if (this.toolPath) return this.toolPath;
    const found = findBinary();
    if (!found) {
      throw new Error('innoextract not found on PATH or in ./bin');
    }
    this.toolPath = found;
    return found;
  }

  async isAvailable(): Promise<boolean> {
    try {
      this.resolveToolPath();
      return true;
    } catch {
      return false;
    }
  }

  async extract(options: ExtractorOptions): Promise<ExtractResult> {
    const { installerPath, workdir, timeoutSeconds = 300 } = options;
    fs.mkdirSync(workdir, { recursive: true });

    const args = ['-d', workdir, installerPath];
    const stdout: string[] = [];
    const stderr: string[] = [];

    await new Promise<void>((resolve, reject) => {
      const child = spawn(this.resolveToolPath(), args, { env: process.env });
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        const timeoutErr = new Error('Extraction timed out');
        (timeoutErr as any).timeout = true;
        reject(timeoutErr);
      }, timeoutSeconds * 1000);

      child.stdout?.on('data', (chunk) => stdout.push(chunk.toString()));
      child.stderr?.on('data', (chunk) => stderr.push(chunk.toString()));

      child.on('error', reject);
      child.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`innoextract exited with code ${code}`));
        }
      });
    });

    return {
      workspace: {
        workdir,
        extractor: this.tool,
        status: 'extracted',
        errors: []
      },
      extractedFiles: collectFiles(workdir),
      stdout: stdout.join(''),
      stderr: stderr.join('')
    };
  }

  mapError(err: unknown): ExtractionError {
    const message = (err as Error)?.message ?? 'Unknown extraction error';
    if (/password/i.test(message)) {
      return { code: 'PASSWORD_PROTECTED', message };
    }
    if (/unsupported/i.test(message)) {
      return { code: 'UNSUPPORTED_COMPRESSION', message };
    }
    if (/segment/i.test(message)) {
      return { code: 'MISSING_SEGMENT', message };
    }
    if ((err as any)?.timeout || /timed out/i.test(message)) {
      return { code: 'UNKNOWN', message: 'Extraction timed out' };
    }
    return { code: 'UNKNOWN', message };
  }
}
