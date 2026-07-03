// Small typed client for the admin API. Every call goes through fetch
// with credentials so the Cloudflare Access cookie is sent.

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string })?.error ?? `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export const api = {
  list: <T>(path: string) => req<{ items: T[] }>(path),
  get: <T>(path: string) => req<T>(path),
  post: <T>(path: string, body: unknown) =>
    req<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    req<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => req<T>(path, { method: "DELETE" }),
  async upload(file: File): Promise<{ url: string; key: string }> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      credentials: "include",
      body: form,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return (await res.json()) as { url: string; key: string };
  },
};
