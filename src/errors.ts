/**
 * Extracts a human-readable message from any thrown value.
 * Avoids the unsafe `error as Error` pattern throughout the codebase.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
