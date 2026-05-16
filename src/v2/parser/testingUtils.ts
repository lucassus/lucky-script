/**
 * Recursively remove `span` fields from an AST (or any nested object/array).
 *
 * Useful in tests that assert AST shape with `toEqual` and don't want to thread
 * exact character offsets through every fixture. Targeted span tests should
 * inspect `.span` directly on the parsed value instead.
 */
export function stripSpans<T>(value: T): T {
  if (Array.isArray(value)) {
    const mapped: unknown[] = (value as unknown[]).map((item) =>
      stripSpans(item),
    );
    return mapped as T;
  }
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      if (key === "span") continue;
      result[key] = stripSpans(child);
    }
    return result as T;
  }
  return value;
}
