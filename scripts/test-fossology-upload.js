#!/usr/bin/env node
/**
 * Smoke test: upload a file to Fossology using env settings.
 *
 * Usage:
 *   node scripts/test-fossology-upload.js /path/to/file
 *
 * Required env:
 *   FOSSOLOGY_API_URL (e.g., http://127.0.0.1:8081/repo or http://fossology:8081/repo)
 *   FOSSOLOGY_TOKEN   (API token from Fossology UI)
 *
 * Optional env:
 *   FOSSOLOGY_FOLDER_NAME (folder to create/use, default "uploads")
 *   FOSSOLOGY_UPLOAD_NAME (override upload name; defaults to file basename)
 */

const fs = require('fs/promises');
const path = require('path');
const process = require('process');
// Attempt to load .env. If dotenv is not installed, fall back to a simple parser.
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

async function main() {
  const [argPath] = process.argv.slice(2);
  const filePath = argPath || process.env.FOSSOLOGY_SMOKE_FILE || path.resolve('tests/fixtures/scanner.spdx.json');

  const apiUrl = (process.env.FOSSOLOGY_API_URL || '').trim();
  const token = (process.env.FOSSOLOGY_TOKEN || '').trim();
  if (!apiUrl || !token) {
    console.log('SKIP fossology upload smoke test: missing FOSSOLOGY_API_URL or FOSSOLOGY_TOKEN');
    return;
  }

  const stats = await fs.stat(filePath).catch(() => null);
  if (!stats || !stats.isFile()) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const fileBuf = await fs.readFile(filePath);
  const uploadName = process.env.FOSSOLOGY_UPLOAD_NAME || path.basename(filePath);
  const folderName = process.env.FOSSOLOGY_FOLDER_NAME || 'uploads';
  const uploadType = process.env.FOSSOLOGY_UPLOAD_TYPE || 'repo';

  const form = new FormData();
  form.set('fileInput', new Blob([fileBuf]), uploadName);
  form.set('folderName', folderName);
  form.set('uploadDescription', 'Fossology upload smoke test');
  // Send both cases to satisfy Fossology API variants.
  form.set('uploadType', uploadType);
  form.set('uploadtype', uploadType);
  // Keep uploads private by default.
  form.set('public', 'false');

  // Fossology API base should be the host/root (e.g., http://127.0.0.1:8081 or http://fossology:8081/repo).
  // If the user passed /api/v1 already, avoid double-appending.
  const normalizedBase = apiUrl.replace(/\/$/, '');

  const baseCandidates = new Set([normalizedBase]);
  if (normalizedBase.includes('127.0.0.1')) {
    baseCandidates.add(normalizedBase.replace('127.0.0.1', 'host.docker.internal'));
    baseCandidates.add(normalizedBase.replace('127.0.0.1', 'fossology'));
  }

  const candidateEndpoints = [];
  for (const base of baseCandidates) {
    const trimmed = base.replace(/\/$/, '');
    if (trimmed.endsWith('/api/v1')) {
      candidateEndpoints.push(`${trimmed}/uploads`);
      continue;
    }
    if (trimmed.includes('/repo')) {
      candidateEndpoints.push(`${trimmed}/api/v1/uploads`);
    } else {
      candidateEndpoints.push(`${trimmed}/repo/api/v1/uploads`);
      candidateEndpoints.push(`${trimmed}/api/v1/uploads`);
    }
  }

  let res;
  let lastText = '';
  let lastErr = '';
  for (const endpoint of candidateEndpoints) {
    console.log(`Uploading to ${endpoint} as ${uploadName} (folder: ${folderName})`);
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      lastText = await res.text();
    } catch (err) {
      // If unreachable, try next endpoint; if none succeed, treat as failure.
      const code = err?.cause?.code || err?.code;
      const msg = (err && err.message) || String(err);
      lastErr = msg || code || 'unknown error';
      if (
        code === 'ECONNREFUSED' ||
        code === 'ENETUNREACH' ||
        code === 'EPERM' ||
        code === 'EHOSTUNREACH' ||
        code === 'ENOTFOUND' ||
        /ECONNREFUSED|ENETUNREACH|EPERM|EHOSTUNREACH|ENOTFOUND/.test(msg)
      ) {
        console.log(`Endpoint unreachable, trying next: ${endpoint} (${code || msg})`);
        continue;
      }
      throw err;
    }
    if (res.ok) {
      break;
    }
    // Retry next endpoint on 404
    if (res.status === 404) continue;
    // For other status, stop trying
    break;
  }

  if (!res || !res.ok) {
    const statusMsg = res ? `${res.status} ${res.statusText}` : lastErr || 'unreachable';
    console.error(`Upload failed: ${statusMsg}\n${lastText}`);
    process.exit(1);
  }

  try {
    const json = JSON.parse(lastText);
    console.log('Upload succeeded:', json);
  } catch {
    console.log('Upload succeeded (raw):', lastText);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
