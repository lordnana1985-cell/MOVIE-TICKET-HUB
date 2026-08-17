type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: any;
  error?: any;
}

class StructuredLogger {
  private isDevelopment = typeof process !== 'undefined' ? process.env.NODE_ENV !== 'production' : true;
  private isTest = typeof process !== 'undefined' ? process.env.NODE_ENV === 'test' || !!process.env.VITEST : false;

  private format(level: LogLevel, message: string, context?: string, data?: any, error?: any): LogPayload {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      ...(data !== undefined ? { data } : {}),
      ...(error !== undefined ? { error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error } : {}),
    };
  }

  public debug(message: string, context?: string, data?: any): void {
    if (this.isTest) return;
    const payload = this.format('debug', message, context, data);
    if (this.isDevelopment) {
      // Clean readable console format in dev
      // eslint-disable-next-line no-console
      console.debug(`[DEBUG] [${payload.context || 'App'}] ${message}`, data || '');
    }
  }

  public info(message: string, context?: string, data?: any): void {
    if (this.isTest) return;
    const payload = this.format('info', message, context, data);
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(payload));
  }

  public warn(message: string, context?: string, data?: any): void {
    if (this.isTest) return;
    const payload = this.format('warn', message, context, data);
    // eslint-disable-next-line no-console
    console.warn(JSON.stringify(payload));
  }

  public error(message: string, context?: string, error?: any, data?: any): void {
    if (this.isTest) return;
    const payload = this.format('error', message, context, data, error);
    // eslint-disable-next-line no-console
    console.error(JSON.stringify(payload));
  }
}

export const logger = new StructuredLogger();
export default logger;
