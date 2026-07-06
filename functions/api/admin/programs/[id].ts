import { json, readJson, safeJsonArray } from "../../../lib/http";
import { requireAdmin } from "../../../lib/access";
import type { Env } from "../../../lib/db";

const FIELDS = [
  "slug", "name", "kicker", "h1", "short_desc", "long_desc",
  "audience", "season", "key_details", "image_url",
  "cta_label", "cta_target", "published", "sort_order",
  "date_range", "time_range", "price", "starts_on",
  "square_catalog_id", "checkout_mode",
] as const;

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;
  const row = await env.DB.prepare(`SELECT * FROM programs WHERE id = ?`)
    .bind(params.id)
    .first<Record<string, unknown>>();
  if (!row) return json({ error: "Not found" }, 404);
  return json({ ...row, key_details: safeJsonArray(row.key_details) });
};

export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;
  const body = (await readJson(request)) as Record<string, unknown>;
  const updates: string[] = [];
  const values: unknown[] = [];
  for (const f of FIELDS) {
    if (f in body) {
      updates.push(`${f} = ?`);
      let v: unknown = body[f];
      if (f === "key_details" && typeof v !== "string") v = JSON.stringify(v ?? []);
      if (f === "published") v = v === false ? 0 : 1;
      values.push(v);
    }
  }
  if (updates.length === 0) return json({ error: "Nothing to update" }, 400);
  updates.push(`updated_at = datetime('now')`);
  values.push(params.id);
  await env.DB.prepare(`UPDATE programs SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();
  return json({ ok: true });
};

// Some proxies/edge configs are cagier about PATCH than POST — expose the
// same update logic on POST too so edits work regardless.
export const onRequestPost = onRequestPatch;

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;
  await env.DB.prepare(`DELETE FROM programs WHERE id = ?`).bind(params.id).run();
  return json({ ok: true });
};
