import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ExtractResult, Extractor, ExtractorOptions } from './extractor';
import { ExtractionError } from '@models/inno/types';

function isToolAvailable(): boolean {
  const command = process.platform === 'win32' ? 'where' : 'which';
  const probe = spawnSync(command, ['innounp'], { stdio: 'ignore' });
  return probe.status === 0;
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

export class InnounpExtractor implements Extractor {
  tool = 'innounp' as const;

  async isAvailable(): Promise<boolean> {
    return isToolAvailable();
  }

  async extract(options: ExtractorOptions): Promise<ExtractResult> {
    const { installerPath, workdir, timeoutSeconds = 300 } = options;
    fs.mkdirSync(workdir, { recursive: true });

    const args = ['-x', `-d${workdir}`, installerPath];
    const stdout: string[] = [];
    const stderr: string[] = [];

    await new Promise<void>((resolve, reject) => {
      const child = spawn('innounp', args, { env: process.env });
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
          reject(new Error(`innounp exited with code ${code}`));
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
    if ((err as any)?.timeout || /timed out/i.test(message)) {
      return { code: 'UNKNOWN', message: 'Extraction timed out' };
    }
    return { code: 'UNKNOWN', message };
  }
}
