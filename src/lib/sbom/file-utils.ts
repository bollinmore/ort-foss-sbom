import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface ChecksumResult {
  algorithm: 'sha256';
  hash: string;
}

export function computeSha256(filePath: string): Promise<ChecksumResult> {
  const hash = crypto.createHash('sha256');
  const stream = fs.createReadStream(filePath);

  return new Promise<ChecksumResult>((resolve, reject) => {
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve({ algorithm: 'sha256', hash: hash.digest('hex') }));
    stream.on('error', reject);
  });
}

export function normalizeInstallPath(p: string): string {
  // Keep install paths deterministic and POSIX-like for SBOM outputs.
  return p.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\//, '');
}

export function buildFileId(installPath: string, hash: string): string {
  // Stable ID derived from path + hash to stay deterministic across runs.
  const normalized = normalizeInstallPath(installPath);
  const material = `${normalized}:${hash}`;
  return crypto.createHash('sha256').update(material).digest('hex').slice(0, 16);
}

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function resolveWorkspacePath(workdir: string, installPath: string): string {
  const normalized = normalizeInstallPath(installPath);
  return path.join(workdir, normalized);
}
