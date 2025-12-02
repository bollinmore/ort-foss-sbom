type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type Stage = string;

export interface LogContext {
  jobId?: string;
  stage?: Stage;
  event?: string;
  code?: string;
  cmd?: string;
  durationMs?: number;
  retries?: number;
  file?: string;
  uploadId?: number;
  correlationId?: string;
  data?: unknown;
}

const REDACTION_PATTERNS = [
  /secret/i,
  /token/i,
  /password/i,
  /passphrase/i
];

function redact(message: string): string {
  let redacted = message;
  for (const pattern of REDACTION_PATTERNS) {
    redacted = redacted.replace(pattern, '***');
  }
  return redacted;
}

function log(level: LogLevel, message: string, context: LogContext = {}, data?: unknown) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message: redact(message),
    stage: context.stage ?? 'initializing',
    ...context,
    data
  };
  // Use console for now; can be swapped for structured logger
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
}

export function createLogger(baseContext: LogContext = {}) {
  return {
    debug: (msg: string, ctx: LogContext = {}, data?: unknown) =>
      log('debug', msg, { ...baseContext, ...ctx }, data),
    info: (msg: string, ctx: LogContext = {}, data?: unknown) =>
      log('info', msg, { ...baseContext, ...ctx }, data),
    warn: (msg: string, ctx: LogContext = {}, data?: unknown) =>
      log('warn', msg, { ...baseContext, ...ctx }, data),
    error: (msg: string, ctx: LogContext = {}, data?: unknown) =>
      log('error', msg, { ...baseContext, ...ctx }, data),
    metric: (name: string, value: number, ctx: LogContext = {}) =>
      log('info', 'metric', { ...baseContext, ...ctx, event: 'metric', code: name }, { value })
  };
}

export function createStageLogger(stage: Stage, baseContext: LogContext = {}) {
  const correlationId = baseContext.correlationId ?? `corr-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  const logger = createLogger({ ...baseContext, stage, correlationId });
  return {
    ...logger,
    stage
  };
}
