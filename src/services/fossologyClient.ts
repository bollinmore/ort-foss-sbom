import { stat } from 'fs/promises';
import path from 'path';
import { createLogger } from '../lib/logger';

const logger = createLogger({ stage: 'fossology_client' });

export interface FossologyUploadResult {
  uploadId: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed';
}

export interface FossologyConfig {
  apiUrl: string;
  token: string;
  mode?: 'stub' | 'live';
  maxArtifactSizeBytes?: number;
  pollSeconds?: number;
  folderId?: string | number;
  folderName?: string;
  uploadType?: 'file' | 'url' | 'vcs' | 'server';
  uploadName?: string;
  uploadDescription?: string;
  accessLevel?: 'public' | 'private' | 'protected';
}

export async function uploadSpdx(spdxPath: string, config: FossologyConfig): Promise<FossologyUploadResult> {
  const mode = config.mode ?? (process.env.FOSSOLOGY_MODE as 'stub' | 'live') ?? 'stub';
  if (mode !== 'live') {
    return { uploadId: 101, status: 'scheduled' };
  }

  if (!config.apiUrl || !config.token) {
    throw new Error('MISSING_FOSSOLOGY_CONFIG');
  }

  if (config.maxArtifactSizeBytes) {
    const stats = await stat(spdxPath);
    if (stats.size > config.maxArtifactSizeBytes) {
      throw new Error('ARTIFACT_TOO_LARGE');
    }
  }

  const fileName = path.basename(spdxPath);
  const fileBuffer = await (await import('fs/promises')).readFile(spdxPath);
  const uploadType = config.uploadType ?? (process.env.FOSSOLOGY_UPLOAD_TYPE as FossologyConfig['uploadType']) ?? 'file';
  const folderId =
    config.folderId ??
    process.env.FOSSOLOGY_FOLDER_ID ??
    '1';
  const folderName = config.folderName ?? process.env.FOSSOLOGY_FOLDER_NAME ?? 'uploads';
  const uploadName = config.uploadName ?? process.env.FOSSOLOGY_UPLOAD_NAME ?? fileName;
  const uploadDescription = config.uploadDescription ?? 'ORT SPDX upload';
  const accessLevel = config.accessLevel ?? (process.env.FOSSOLOGY_ACCESS_LEVEL as FossologyConfig['accessLevel']) ?? 'private';

  // Use native FormData (Node 18+) to stream upload.
  const form = new FormData();
  form.set('file', new Blob([fileBuffer]), fileName);
  form.set('fileInput', new Blob([fileBuffer]), uploadName);
  form.set('folderId', `${folderId}`);
  form.set('folderid', `${folderId}`);
  form.set('folderName', folderName);
  form.set('foldername', folderName);
  form.set('uploadName', uploadName);
  form.set('uploadname', uploadName);
  form.set('uploadDescription', uploadDescription);
  form.set('description', uploadDescription);
  form.set('uploadType', uploadType);
  form.set('uploadtype', uploadType);
  form.set('public', accessLevel === 'public' ? 'true' : 'false');
  form.set('accessLevel', accessLevel);
  form.set('applyGlobal', 'false');
  form.set('ignoreScm', 'true');

  logger.info('fossology_upload_start', { event: 'fossology_upload_start', file: fileName });
  const res = await fetch(`${config.apiUrl.replace(/\/$/, '')}/api/v1/uploads`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      uploadType,
      folderId: `${folderId}`,
      uploadDescription,
      public: accessLevel
    },
    body: form
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FOSSOLOGY_UPLOAD_FAILED:${res.status}:${text}`);
  }

  const data = (await res.json()) as { uploadId?: number; id?: number; status?: FossologyUploadResult['status'] };
  return { uploadId: data.uploadId ?? data.id ?? 0, status: data.status ?? 'scheduled' };
}

export async function fetchFossologyStatus(uploadId: number, config?: FossologyConfig): Promise<Record<string, unknown>> {
  if (!uploadId) throw new Error('INVALID_UPLOAD_ID');
  const mode =
    config?.mode ?? (process.env.FOSSOLOGY_MODE as 'stub' | 'live') ?? 'stub';
  if (mode !== 'live') {
    // Offline stub: use fixture for deterministic tests.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const data = require('../../tests/fixtures/fossology-status.json');
    return data;
  }

  const apiUrl = config?.apiUrl ?? process.env.FOSSOLOGY_API_URL;
  const token = config?.token ?? process.env.FOSSOLOGY_TOKEN;
  if (!apiUrl || !token) throw new Error('MISSING_FOSSOLOGY_CONFIG');

  const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/v1/uploads/${uploadId}/report`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FOSSOLOGY_STATUS_FAILED:${res.status}:${text}`);
  }
  return res.json();
}
