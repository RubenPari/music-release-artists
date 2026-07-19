export function extractApiError(err: unknown, fallback: string): string {
  const message = (err as { error?: { message?: string } } | null)?.error
    ?.message;
  return message || fallback;
}
