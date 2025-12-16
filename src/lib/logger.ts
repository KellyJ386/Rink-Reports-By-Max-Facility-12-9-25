/**
 * Structured Logger
 *
 * Provides structured logging for the MFO application.
 * In production, this would integrate with a logging service.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  requestId?: string;
  userId?: string;
  facility?: string;
}

// Log level priorities
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

// Current minimum log level
const MIN_LOG_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  if (process.env.NODE_ENV === 'production') {
    // JSON format for production (better for log aggregation)
    return JSON.stringify(entry);
  }

  // Human-readable format for development
  const { timestamp, level, message, context, error } = entry;
  const levelColors: Record<LogLevel, string> = {
    debug: '\x1b[36m', // cyan
    info: '\x1b[32m', // green
    warn: '\x1b[33m', // yellow
    error: '\x1b[31m', // red
    fatal: '\x1b[35m', // magenta
  };
  const reset = '\x1b[0m';

  let output = `${levelColors[level]}[${level.toUpperCase()}]${reset} ${timestamp} - ${message}`;

  if (context && Object.keys(context).length > 0) {
    output += `\n  Context: ${JSON.stringify(context, null, 2)}`;
  }

  if (error) {
    output += `\n  Error: ${error.name}: ${error.message}`;
    if (error.stack) {
      output += `\n  Stack: ${error.stack}`;
    }
  }

  return output;
}

/**
 * Write log entry
 */
function writeLog(entry: LogEntry): void {
  // Check if we should log at this level
  if (LOG_LEVELS[entry.level] < LOG_LEVELS[MIN_LOG_LEVEL]) {
    return;
  }

  const output = formatLogEntry(entry);

  switch (entry.level) {
    case 'error':
    case 'fatal':
      console.error(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    default:
      console.log(output);
  }

  // In production, also send to external logging service
  if (process.env.NODE_ENV === 'production') {
    sendToLoggingService(entry);
  }
}

/**
 * Send log to external service (placeholder)
 */
function sendToLoggingService(entry: LogEntry): void {
  // In production, this would send to:
  // - Datadog
  // - LogRocket
  // - Sentry
  // - CloudWatch
  // etc.
  //
  // Example:
  // fetch('https://logs.example.com/api/logs', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(entry),
  // });
}

/**
 * Create a log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  if (context) {
    entry.context = context;
  }

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return entry;
}

/**
 * Logger class with context support
 */
class Logger {
  private context: LogContext = {};

  constructor(context?: LogContext) {
    if (context) {
      this.context = context;
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    return new Logger({ ...this.context, ...context });
  }

  /**
   * Add context to this logger
   */
  withContext(context: LogContext): Logger {
    this.context = { ...this.context, ...context };
    return this;
  }

  /**
   * Log at debug level
   */
  debug(message: string, context?: LogContext): void {
    writeLog(createLogEntry('debug', message, { ...this.context, ...context }));
  }

  /**
   * Log at info level
   */
  info(message: string, context?: LogContext): void {
    writeLog(createLogEntry('info', message, { ...this.context, ...context }));
  }

  /**
   * Log at warn level
   */
  warn(message: string, context?: LogContext): void {
    writeLog(createLogEntry('warn', message, { ...this.context, ...context }));
  }

  /**
   * Log at error level
   */
  error(message: string, error?: Error | LogContext, context?: LogContext): void {
    if (error instanceof Error) {
      writeLog(
        createLogEntry('error', message, { ...this.context, ...context }, error)
      );
    } else {
      writeLog(
        createLogEntry('error', message, { ...this.context, ...error })
      );
    }
  }

  /**
   * Log at fatal level
   */
  fatal(message: string, error?: Error, context?: LogContext): void {
    writeLog(
      createLogEntry('fatal', message, { ...this.context, ...context }, error)
    );
  }

  /**
   * Log API request
   */
  logRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    this.info(`${method} ${path} ${statusCode} ${duration}ms`, {
      ...context,
      method,
      path,
      statusCode,
      duration,
    });
  }
}

// Default logger instance
export const logger = new Logger();

// Export Logger class for custom instances
export { Logger };

// Export types
export type { LogLevel, LogContext, LogEntry };
