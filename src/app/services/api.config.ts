// Single place to point the Angular app at the backend.
//
// Change this to your deployed API URL (for example
// 'https://liceoscholar-be.onrender.com/api') when you go live.

export const API_BASE_URL = 'http://localhost:4000/api';

/** Server origin used to resolve uploaded-file paths like /uploads/x.png. */
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

/** Turns a stored file path into a URL the browser can load. */
export function resolveFileUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** Pulls a human-readable message out of an HttpClient error. */
export function describeHttpError(error: unknown): string {
  const candidate = error as { error?: unknown; message?: string; status?: number; name?: string };

  // Status 0 means the request never reached the API (backend stopped, wrong
  // port, offline). Say so plainly instead of a vague "something went wrong".
  if (candidate?.status === 0) {
    return `Cannot reach the server at ${API_ORIGIN}. Make sure the backend is running (npm run dev).`;
  }

  const body = candidate?.error;
  if (body && typeof body === 'object' && 'error' in body) {
    const message = (body as { error?: unknown }).error;
    if (typeof message === 'string' && message) {
      return message;
    }
  }

  if (typeof body === 'string' && body) {
    return body;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

/**
 * True when the API refused a login because the student's email is not
 * confirmed yet. Used to offer the demo "confirm and continue" shortcut.
 */
export function isEmailUnconfirmedError(error: unknown): boolean {
  const candidate = error as { status?: number; error?: unknown };
  if (candidate?.status !== 403) {
    return false;
  }

  const body = candidate.error;
  const message =
    body && typeof body === 'object' && 'error' in body
      ? (body as { error?: unknown }).error
      : body;

  return typeof message === 'string' && /confirm your email/i.test(message);
}
