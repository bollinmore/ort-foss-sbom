#!/usr/bin/env node
/**
 * Run the Inno SBOM CLI against the iq2 installer fixture and upload results to Fossology.
 * Supports two upload modes:
 *   - archive (default): create a single archive (zip|tar.gz) of the workspace and upload that file
 *   - files: upload every file under the workspace, preserving folder hierarchy
 *
 * Required env:
 *   FOSSOLOGY_API_URL (e.g., http://127.0.0.1:8081/repo)
 *   FOSSOLOGY_TOKEN   (API token from Fossology UI)
 *
 * Optional env:
 *   FOSSOLOGY_PARENT_FOLDER_ID (defaults to root/1)
 *   FOSSOLOGY_FOLDER_NAME      (base name for the newly created folder; timestamp is appended)
 *   FOSSOLOGY_ACCESS_LEVEL     (public|private|protected; default private)
 */

const fs = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');
const process = require('process');

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();
} catch (_err) {
  const envPath = path.resolve(process.cwd(), '.env');
  try {
    const raw = require('fs').readFileSync(envPath, 'utf8');
    raw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .forEach((line) => {
        const idx = line.indexOf('=');
        if (idx > -1) {
          const key = line.slice(0, idx).trim();
          const val = line.slice(idx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
  } catch {
    // ignore if .env missing
  }
}

function parseArgs(argv) {
  const opts = {
    uploadMode: 'archive', // archive | files
    archiveFormat: 'zip' // zip | tar.gz
  };
  for (const arg of argv.slice(2)) {
    if (!arg.startsWith('--')) continue;
    const [key, val] = arg.replace(/^--/, '').split('=');
    if (key === 'upload-mode' && val) {
      opts.uploadMode = val;
    }
    if (key === 'archive-format' && val) {
      opts.archiveFormat = val;
    }
  }
  return opts;
}

function resolveApiBase(rawUrl) {
  const normalized = rawUrl.replace(/\/+$/, '');
  if (normalized.endsWith('/api/v1')) return normalized;
  if (normalized.includes('/repo') && !normalized.endsWith('/repo')) {
    const trimmed = normalized.replace(/\/api\/v1$/, '').replace(/\/$/, '');
    return trimmed.endsWith('/repo') ? `${trimmed}/api/v1` : `${trimmed}/repo/api/v1`;
  }
  if (normalized.endsWith('/repo')) return `${normalized}/api/v1`;
  return `${normalized}/repo/api/v1`;
}

async function runInnoScan(installerPath, outputDir) {
  console.log(`Running inno-sbom scan for ${installerPath} -> ${outputDir}`);
  await new Promise((resolve, reject) => {
    const proc = spawn(
      'node',
      [
        path.resolve(__dirname, '..', 'dist', 'cli', 'inno-sbom.js'),
        '--installer',
        installerPath,
        '--output-dir',
        outputDir,
        '--formats',
        'spdx,cyclonedx',
        '--offline',
        '--retain-workspace'
      ],
      { stdio: 'inherit', cwd: path.resolve(__dirname, '..') }
    );
    proc.on('error', reject);
    proc.on('exit', (code) => {
      if (code === 0) return resolve();
      reject(new Error(`inno-sbom failed with exit code ${code}`));
    });
  });
}

async function createFolder(apiBase, token, folderName, parentFolder) {
  const res = await fetch(`${apiBase}/folders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      folderName,
      parentFolder: String(parentFolder),
      description: `Inno workspace upload ${folderName}`
    }
  });

  const location = res.headers.get('location') || res.headers.get('Location') || '';
  const bodyText = await res.text();
  if (!res.ok) {
    throw new Error(`Create folder failed: ${res.status} ${res.statusText} ${bodyText || ''}`.trim());
  }

  const locationId = location.match(/\/folders\/(\d+)/i)?.[1];
  let folderId = locationId ? Number(locationId) : undefined;
  if (!folderId && bodyText) {
    try {
      const parsed = JSON.parse(bodyText);
      folderId =
        parsed?.id ??
        parsed?.folderId ??
        (typeof parsed?.message === 'number'
          ? parsed.message
          : parsed?.message
            ? parseInt(parsed.message, 10)
            : undefined);
    } catch {
      // body might be plain text, ignore
    }
  }
  if (!folderId) {
    throw new Error(`Create folder succeeded but folder id not found. Location=${location} Body=${bodyText}`);
  }
  return folderId;
}

const folderCache = new Map();
async function ensureFolder(apiBase, token, parentId, segments) {
  const key = `${parentId}:${segments.join('/')}`;
  if (folderCache.has(key)) return folderCache.get(key);
  let currentId = parentId;
  let pathSoFar = '';
  for (const seg of segments) {
    pathSoFar = pathSoFar ? `${pathSoFar}/${seg}` : seg;
    const cacheKey = `${parentId}:${pathSoFar}`;
    if (folderCache.has(cacheKey)) {
      currentId = folderCache.get(cacheKey);
      continue;
    }
    const createdId = await createFolder(apiBase, token, seg, currentId);
    folderCache.set(cacheKey, createdId);
    currentId = createdId;
  }
  folderCache.set(key, currentId);
  return currentId;
}

async function uploadFile(apiBase, token, folderId, folderName, accessLevel, filePath, relativePath) {
  const fileBuf = await fs.readFile(filePath);
  const fileName = path.basename(filePath);
  const uploadDescription = `Inno workspace artifact ${relativePath}`;

  const form = new FormData();
  form.set('fileInput', new Blob([fileBuf]), fileName);
  form.set('folderId', String(folderId));
  form.set('folderid', String(folderId));
  form.set('folderName', folderName);
  form.set('foldername', folderName);
  form.set('uploadName', fileName);
  form.set('uploadname', fileName);
  form.set('uploadDescription', uploadDescription);
  form.set('description', uploadDescription);
  form.set('uploadType', 'file');
  form.set('uploadtype', 'file');
  form.set('public', accessLevel === 'public' ? 'true' : 'false');
  form.set('accessLevel', accessLevel);

  const res = await fetch(`${apiBase}/uploads`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      uploadType: 'file',
      folderId: String(folderId),
      uploadDescription,
      public: accessLevel
    },
    body: form
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Upload failed for ${fileName}: ${res.status} ${res.statusText} ${text || ''}`.trim());
  }
  let uploadId;
  try {
    const data = JSON.parse(text);
    uploadId =
      data?.uploadId ??
      data?.id ??
      (typeof data?.message === 'number' ? data.message : data?.message ? parseInt(data.message, 10) : undefined);
  } catch {
    // ignore parse errors; response may be plain text
  }
  console.log(`Uploaded ${relativePath} (uploadId=${uploadId ?? 'unknown'})`);
}

async function listWorkspaceFilesRecursive(baseDir) {
  const stack = [baseDir];
  const files = [];
  while (stack.length) {
    const dir = stack.pop();
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

function commandExists(cmd) {
  return new Promise((resolve) => {
    const proc = spawn('command', ['-v', cmd], { shell: true });
    proc.on('exit', (code) => resolve(code === 0));
    proc.on('error', () => resolve(false));
  });
}

async function createArchive(workspaceRoot, outputDir, archiveFormat) {
  const safeFormat = archiveFormat === 'tar.gz' ? 'tar.gz' : 'zip';
  const archivePath =
    safeFormat === 'zip'
      ? path.join(outputDir, 'workspace.zip')
      : path.join(outputDir, 'workspace.tar.gz');

  const hasZip = await commandExists('zip');
  const hasTar = await commandExists('tar');

  if (safeFormat === 'zip') {
    if (!hasZip) {
      throw new Error('zip command not found. Install zip or use --archive-format=tar.gz');
    }
    await new Promise((resolve, reject) => {
      const proc = spawn('zip', ['-r', archivePath, '.'], {
        cwd: workspaceRoot,
        stdio: 'inherit'
      });
      proc.on('error', reject);
      proc.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`zip exited ${code}`))));
    });
    return archivePath;
  }

  if (!hasTar) {
    throw new Error('tar command not found. Install tar or switch to --archive-format=zip');
  }
  await new Promise((resolve, reject) => {
    const proc = spawn('tar', ['-czf', archivePath, '-C', workspaceRoot, '.'], {
      stdio: 'inherit'
    });
    proc.on('error', reject);
    proc.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`tar exited ${code}`))));
  });
  return archivePath;
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const { uploadMode, archiveFormat } = parseArgs(process.argv);
  const installerPath = path.resolve(repoRoot, 'tests/fixtures/inno/iq2-setup.exe');
  const outputDir = path.resolve(repoRoot, 'out/inno-sbom');
  const apiUrl = (process.env.FOSSOLOGY_API_URL || '').trim();
  const token = (process.env.FOSSOLOGY_TOKEN || '').trim();
  if (!apiUrl || !token) {
    throw new Error('FOSSOLOGY_API_URL and FOSSOLOGY_TOKEN are required');
  }

  const baseFolderEnv = process.env.FOSSOLOGY_FOLDER_NAME || 'inno-workspace';
  const folderName = `${baseFolderEnv}-${Date.now()}`;
  const parentFolder = process.env.FOSSOLOGY_PARENT_FOLDER_ID || process.env.FOSSOLOGY_FOLDER_ID || '1';
  const accessLevel = process.env.FOSSOLOGY_ACCESS_LEVEL || 'private';
  const apiBase = resolveApiBase(apiUrl);

  await runInnoScan(installerPath, outputDir);

  const workspaceRoot = path.join(outputDir, 'workspace');
  const folderId = await createFolder(apiBase, token, folderName, parentFolder);
  folderCache.set(`${parentFolder}:${folderName}`, folderId);

  if (uploadMode === 'archive') {
    const archivePath = await createArchive(workspaceRoot, outputDir, archiveFormat);
    const archiveName = path.basename(archivePath);
    await uploadFile(apiBase, token, folderId, folderName, accessLevel, archivePath, archiveName);
    console.log(`Archive uploaded to folder ${folderName} (id=${folderId}) as ${archiveName}`);
    return;
  }

  const files = await listWorkspaceFilesRecursive(workspaceRoot);
  if (files.length === 0) {
    throw new Error(`No files found under ${workspaceRoot}; run the scan first.`);
  }

  for (const filePath of files) {
    const relative = path.relative(workspaceRoot, filePath);
    const dirSegments = path.dirname(relative) === '.' ? [] : path.dirname(relative).split(path.sep);
    const targetFolderId = dirSegments.length
      ? await ensureFolder(apiBase, token, folderId, dirSegments)
      : folderId;
    await uploadFile(apiBase, token, targetFolderId, dirSegments.at(-1) || folderName, accessLevel, filePath, relative);
  }
  console.log(`All files uploaded to folder ${folderName} (id=${folderId}) with workspace hierarchy preserved`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
