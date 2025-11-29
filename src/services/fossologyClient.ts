import { requestJson } from '../lib/httpClient';

export interface FossologyUploadResult {
  uploadId: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed';
}

export interface FossologyConfig {
  apiUrl: string;
  token: string;
}

export async function uploadSpdx(spdxPath: string, config: FossologyConfig): Promise<FossologyUploadResult> {
  // Placeholder: In real flow, upload file contents. Here we simulate success.
  if (!config.apiUrl || !config.token) {
    throw new Error('MISSING_FOSSOLOGY_CONFIG');
  }
  // Simulate a call to Fossology API; this is stubbed for offline determinism.
  void (await requestJson(`${config.apiUrl}/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.token}` },
    body: { path: spdxPath },
    retries: 0
  }).catch(() => ({ status: 202 })));

  return { uploadId: 101, status: 'scheduled' };
}

export async function fetchFossologyStatus(uploadId: number): Promise<Record<string, unknown>> {
  if (!uploadId) throw new Error('INVALID_UPLOAD_ID');
  // Offline stub: use fixture for deterministic tests.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const data = require('../../tests/fixtures/fossology-status.json');
  return data;
}
