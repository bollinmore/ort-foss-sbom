import { createWriteStream } from 'fs';
import { stat } from 'fs/promises';
import { pipeline } from 'stream/promises';
import { PassThrough, type Readable } from 'stream';
import path from 'path';
import { createLogger } from '@lib/logger';

const logger = createLogger({ stage: 'orchestrator' });

const DEFAULT_MAX_ARTIFACT_BYTES = 500 * 1024 * 1024; // 500MB cap per spec edge case

export class ArtifactTooLargeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ArtifactTooLargeError';
  }
}

/**
 * Streams an artifact to disk while enforcing a maximum size.
 * Throws ArtifactTooLargeError if the size cap is exceeded.
 */
export async function writeArtifactWithCap(
  readable: Readable,
  destination: string,
  maxBytes: number = DEFAULT_MAX_ARTIFACT_BYTES
): Promise<void> {
  let bytes = 0;
  const counting = new PassThrough();
  counting.on('data', (chunk: Buffer) => {
    bytes += chunk.length;
    if (bytes > maxBytes) {
      counting.destroy(new ArtifactTooLargeError('ARTIFACT_TOO_LARGE'));
    }
  });

  const sink = createWriteStream(destination, { flags: 'w' });

  try {
    await pipeline(readable, counting, sink);
    logger.info('artifact_written', {
      code: 'ARTIFACT_WRITTEN',
      event: 'artifact_written',
      data: { destination, bytes }
    });
  } catch (err) {
    sink.destroy();
    logger.error('artifact_write_failed', {
      code: 'ARTIFACT_WRITE_FAILED',
      event: 'artifact_write_failed',
      data: { destination, bytes, error: (err as Error).message }
    });
    throw err;
  }
}

/**
 * Quick check to ensure an existing artifact does not exceed the cap.
 */
export async function assertArtifactWithinCap(
  filePath: string,
  maxBytes: number = DEFAULT_MAX_ARTIFACT_BYTES
): Promise<void> {
  const stats = await stat(filePath);
  if (stats.size > maxBytes) {
    throw new ArtifactTooLargeError('ARTIFACT_TOO_LARGE');
  }
}
