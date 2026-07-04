import { json, readJson } from "../../../lib/http";
import { requireAdmin } from "../../../lib/access";
import type { Env } from "../../../lib/db";

const ALLOWED_STATUS = new Set(["new", "read", "archived"]);

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;
  const row = await env.DB.prepare(`SELECT * FROM submissions WHERE id = ?`).bind(params.id).first();
  if (!row) return json({ error: "Not found" }, 404);
  return json(row);
};

export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;
  const body = (await readJson(request)) as Record<string, unknown>;
  if (typeof body.status !== "string" || !ALLOWED_STATUS.has(body.status)) {
    return json({ error: "Valid status required" }, 400);
  }
  await env.DB.prepare(`UPDATE submissions SET status = ? WHERE id = ?`)
    .bind(body.status, params.id)
    .run();
  return json({ ok: true });
};

// Some proxies/edge configs are cagier about PATCH than POST — expose the
// same update logic on POST too so edits work regardless.
export const onRequestPost = onRequestPatch;

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;
  await env.DB.prepare(`DELETE FROM submissions WHERE id = ?`).bind(params.id).run();
  return json({ ok: true });
};
