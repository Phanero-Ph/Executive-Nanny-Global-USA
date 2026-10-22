/** Drizzle wraps driver errors; inspect the bounded cause chain. */
export function isDuplicateEntry(error: unknown): boolean {
  let current = error;
  for (let depth = 0; depth < 5 && current && typeof current === "object"; depth++) {
    if ("code" in current && current.code === "ER_DUP_ENTRY") return true;
    current = "cause" in current ? current.cause : null;
  }
  return false;
}
