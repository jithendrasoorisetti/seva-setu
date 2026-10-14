import { redactSensitiveData, redactObject } from './redactor';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class RedactingLogger {
  private formatMessage(level: LogLevel, message: string, metadata?: unknown): string {
    const timestamp = new Date().toISOString();
    const cleanMessage = redactSensitiveData(message);
    const logEntry: Record<string, unknown> = {
      timestamp,
      level,
      message: cleanMessage,
    };

    if (metadata !== undefined) {
      logEntry.metadata = redactObject(metadata);
    }

    return JSON.stringify(logEntry);
  }

  public info(message: string, metadata?: unknown): void {
    console.info(this.formatMessage('info', message, metadata));
  }

  public warn(message: string, metadata?: unknown): void {
    console.warn(this.formatMessage('warn', message, metadata));
  }

  public error(message: string, error?: unknown, metadata?: unknown): void {
    const errorDetails = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : error;
    console.error(this.formatMessage('error', message, { error: errorDetails, metadata }));
  }

  public debug(message: string, metadata?: unknown): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage('debug', message, metadata));
    }
  }
}

export const logger = new RedactingLogger();
