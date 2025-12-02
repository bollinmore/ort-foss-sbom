import fs from 'fs';
import path from 'path';
import { buildFileId, computeSha256, normalizeInstallPath } from '@lib/sbom/file-utils';
import { ExtractedFile, FileType } from '@models/inno/types';

function classifyFileType(filePath: string): FileType {
  const ext = path.extname(filePath).toLowerCase();
  if (['.exe', '.com'].includes(ext)) return 'executable';
  if (['.dll'].includes(ext)) return 'dll';
  if (['.ps1', '.bat', '.cmd', '.vbs', '.js'].includes(ext)) return 'script';
  if (['.ini', '.cfg', '.conf', '.xml', '.json', '.yaml', '.yml'].includes(ext)) return 'config';
  if (['.txt', '.md', '.rtf', '.pdf', '.chm'].includes(ext)) return 'documentation';
  if (['.ico', '.bmp', '.png', '.jpg', '.jpeg', '.gif', '.res'].includes(ext)) return 'resource';
  return 'other';
}

function detectLanguageFromPath(installPath: string): string {
  const segments = normalizeInstallPath(installPath).split('/');
  const langToken = segments.find((seg) => /^[a-z]{2}(-[A-Z]{2})?$/.test(seg));
  return langToken ?? 'unknown';
}

function detectArchitectureFromName(installPath: string): 'x86' | 'x64' | 'arm64' | 'unknown' {
  const normalized = installPath.toLowerCase();
  if (normalized.includes('x64') || normalized.includes('amd64')) return 'x64';
  if (normalized.includes('x86') || normalized.includes('win32')) return 'x86';
  if (normalized.includes('arm64') || normalized.includes('aarch64')) return 'arm64';
  return 'unknown';
}

function captureMetadata(filePath: string) {
  // Placeholder metadata capture: real implementation should parse PE headers.
  return {
    productName: undefined,
    fileDescription: undefined,
    fileVersion: undefined,
    companyName: undefined,
    resources: {}
  };
}

function listFiles(root: string): string[] {
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

export async function classifyExtractedFiles(
  workdir: string,
  installRoot?: string,
  expectedPaths?: Set<string>
): Promise<ExtractedFile[]> {
  const root = installRoot ?? workdir;
  const files = listFiles(workdir);
  const classified: ExtractedFile[] = [];

  for (const file of files) {
    const installPath = normalizeInstallPath(path.relative(root, file));
    const checksum = await computeSha256(file);
    const fileType = classifyFileType(file);
    const architecture = detectArchitectureFromName(installPath);
    const language = detectLanguageFromPath(installPath);
    const metadata = captureMetadata(file);
    const expected = expectedPaths ? expectedPaths.has(installPath) : true;

    classified.push({
      id: buildFileId(installPath, checksum.hash),
      installPath,
      extractedPath: file,
      sizeBytes: fs.statSync(file).size,
      checksum: checksum.hash,
      type: fileType,
      architecture,
      language,
      metadata,
      status: 'ok',
      statusMessage: expected ? undefined : 'unexpected file'
    });
  }

  return classified;
}
