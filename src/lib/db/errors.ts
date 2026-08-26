import { AppError } from '../errors';

export interface DbErrorOptions {
  operation: string;
  cause?: unknown;
  fallbackUsed?: boolean;
  details?: unknown;
}

export class DbError extends AppError {
  public operation: string;
  public fallbackUsed: boolean;
  public override cause?: unknown;

  constructor(message: string, options: DbErrorOptions) {
    super(message, 500, 'DB_ERROR', options.details);
    this.name = 'DbError';
    this.operation = options.operation;
    this.fallbackUsed = options.fallbackUsed ?? false;
    this.cause = options.cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  public static fromError(
    operation: string,
    error: unknown,
    fallbackUsed = false,
    customMessage?: string
  ): DbError {
    const rawMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Unknown database error';
    const message = customMessage
      ? `${customMessage}: ${rawMessage}`
      : `Database error during ${operation}: ${rawMessage}`;
    return new DbError(message, {
      operation,
      cause: error,
      fallbackUsed,
      details: error instanceof Error ? { name: error.name, stack: error.stack } : undefined,
    });
  }
}

export function isDbError(error: unknown): error is DbError {
  return error instanceof DbError;
}
