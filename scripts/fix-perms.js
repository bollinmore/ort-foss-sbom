#!/usr/bin/env node
// Ensure bundled helper binaries are executable on Unix-like systems.
const fs = require('fs/promises');

const targets = ['bin/innounp.exe', 'bin/innoextract.exe', 'bin/ort-docker.sh'];

async function ensureExecutable(file) {
  try {
    await fs.chmod(file, 0o755);
  } catch {
    // Ignore missing files; this is best-effort.
  }
}

Promise.all(targets.map(ensureExecutable)).catch((err) => {
  console.error('Failed to set executable permissions', err);
  process.exit(1);
});
