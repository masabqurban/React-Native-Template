export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'INVALID_RESPONSE'
  // Codes returned by the API pass through as-is (e.g. "EMAIL_TAKEN").
  | (string & {});

/** Every failure from the API layer is normalised into this one error type. */
export class ApiError extends Error {
  override readonly name = 'ApiError';
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: unknown;

  constructor(message: string, status: number, code: ApiErrorCode, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get isClientError() {
    return this.status >= 400 && this.status < 500;
  }

  get isNotFound() {
    return this.status === 404;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** A message for a person: API messages are written for users; everything else is generic. */
export function errorMessage(error: unknown): string {
  if (!isApiError(error)) return 'Something went wrong. Please try again.';
  if (error.code === 'NETWORK_ERROR') return "You're offline or the server can't be reached.";
  if (error.code === 'TIMEOUT') return 'The server took too long to respond. Please try again.';
  if (error.code === 'INVALID_RESPONSE') return 'The server sent an unexpected response.';
  return error.message;
}
