import { HttpErrorResponse } from '@angular/common/http';

/** Turns an API error into one readable sentence. */
export function errMsg(e: unknown): string {
  const err = e as HttpErrorResponse;
  if (err?.status === 0) return 'Cannot reach the server. Is the API running?';
  const body = err?.error;
  if (body?.errors) {
    const first = Object.values(body.errors as Record<string, string[]>)[0];
    if (first?.[0]) return first[0];
  }
  return body?.message ?? 'Something went wrong. Please try again.';
}
