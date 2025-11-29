type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  jobId?: string;
  stage?: string;
  event?: string;
  code?: string;
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
      log('error', msg, { ...baseContext, ...ctx }, data)
  };
}
