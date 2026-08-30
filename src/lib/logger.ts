export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: any;
  error?: any;
}

export type ErrorTrackerHook = (payload: LogPayload) => void | Promise<void>;

export class StructuredLogger {
  private isDevelopment =
    typeof process !== 'undefined' ? process.env.NODE_ENV !== 'production' : true;
  private isTest =
    typeof process !== 'undefined'
      ? process.env.NODE_ENV === 'test' || !!process.env.VITEST
      : false;

  private errorTrackingEndpoint: string | null = null;
  private errorHooks: Set<ErrorTrackerHook> = new Set();

  constructor() {
    this.resolveTrackingEndpoint();
  }

  private resolveTrackingEndpoint(): void {
    if (typeof process !== 'undefined' && process.env) {
      this.errorTrackingEndpoint =
        process.env.ERROR_TRACKING_ENDPOINT || process.env.SENTRY_DSN || null;
    }
    if (
      !this.errorTrackingEndpoint &&
      typeof import.meta !== 'undefined' &&
      (import.meta as any).env
    ) {
      this.errorTrackingEndpoint =
        (import.meta as any).env.VITE_ERROR_TRACKING_ENDPOINT ||
        (import.meta as any).env.VITE_SENTRY_DSN ||
        null;
    }
  }

  public setTrackingEndpoint(endpoint: string | null): void {
    this.errorTrackingEndpoint = endpoint;
  }

  public getTrackingEndpoint(): string | null {
    return this.errorTrackingEndpoint;
  }

  /**
   * Registers a callback hook to be notified whenever an error is logged.
   * Returns an unregister function.
   */
  public onError(hook: ErrorTrackerHook): () => void {
    this.errorHooks.add(hook);
    return () => {
      this.errorHooks.delete(hook);
    };
  }

  private format(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any,
    error?: any
  ): LogPayload {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      ...(data !== undefined ? { data } : {}),
      ...(error !== undefined
        ? {
            error:
              error instanceof Error
                ? { name: error.name, message: error.message, stack: error.stack }
                : error,
          }
        : {}),
    };
  }

  public debug(message: string, context?: string, data?: any): void {
    if (this.isTest) return;
    const payload = this.format('debug', message, context, data);
    if (this.isDevelopment) {
      console.debug(`[DEBUG] [${payload.context || 'App'}] ${message}`, data || '');
    }
  }

  public info(message: string, context?: string, data?: any): void {
    if (this.isTest) return;
    const payload = this.format('info', message, context, data);
    console.log(JSON.stringify(payload));
  }

  public warn(message: string, context?: string, data?: any): void {
    if (this.isTest) return;
    const payload = this.format('warn', message, context, data);
    console.warn(JSON.stringify(payload));
  }

  public error(message: string, context?: string, error?: any, data?: any): void {
    const payload = this.format('error', message, context, data, error);

    // Notify registered error hooks
    for (const hook of this.errorHooks) {
      try {
        hook(payload);
      } catch {
        // Prevent recursive errors in monitoring
      }
    }

    // Forward to remote error-tracking endpoint or Sentry if configured
    if (this.errorTrackingEndpoint && typeof fetch !== 'undefined') {
      try {
        fetch(this.errorTrackingEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'error_log',
            payload,
          }),
        }).catch(() => {
          // Silent swallow of network failure during log transport
        });
      } catch {
        // Silent swallow of invocation errors
      }
    }

    if (this.isTest) return;
    console.error(JSON.stringify(payload));
  }
}

export const logger = new StructuredLogger();
export default logger;
