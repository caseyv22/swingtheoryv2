// Shared HTTP helpers for Pages Functions.

export function json(data: unknown, status = 200, headers?: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

export function cachedJson(data: unknown, seconds: number) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 4}`,
    },
  });
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

// D1 stores JSON-array columns (key_details, specialties, ...) as raw TEXT.
// Every place that reads one of those columns back out needs to parse it
// into an actual array before handing it to the client, otherwise
// client code that calls .join()/.map() on it throws (this is what broke
// the admin Edit buttons: the admin GET routes returned the raw TEXT
// column instead of a parsed array).
export function safeJsonArray(s: unknown): string[] {
  if (Array.isArray(s)) return s.map(String);
  if (typeof s !== "string") return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
