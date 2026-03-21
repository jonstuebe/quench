export function isHealthUnauthorizedError(e: unknown): boolean {
  const err = e as { message?: string; code?: string };
  return err?.code === "HEALTHKIT_ERROR" && err?.message === "Not authorized";
}
