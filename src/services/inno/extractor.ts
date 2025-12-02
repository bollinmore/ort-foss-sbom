import { ExtractorTool, ExtractionError, ExtractionWorkspace } from '@models/inno/types';

export interface ExtractResult {
  workspace: ExtractionWorkspace;
  extractedFiles: string[]; // absolute paths to extracted files
  stdout?: string;
  stderr?: string;
}

export interface ExtractorOptions {
  installerPath: string;
  workdir: string;
  timeoutSeconds?: number;
}

export interface Extractor {
  tool: ExtractorTool;
  /**
   * Returns true if the tool is available on the runner (e.g., present in PATH).
   */
  isAvailable(): Promise<boolean>;
  /**
   * Executes extraction. Implementations should stream stdout/stderr to allow structured logging.
   * Throws an ExtractionError on failure.
   */
  extract(options: ExtractorOptions): Promise<ExtractResult>;
  /**
   * Maps raw process errors to domain-specific ExtractionError objects.
   */
  mapError(err: unknown): ExtractionError;
}
