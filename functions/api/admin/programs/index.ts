import { json, readJson } from "../../../lib/http";
import { requireAdmin } from "../../../lib/access";
import type { Env } from "../../../lib/db";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;
  const { results = [] } = await env.DB.prepare(
    `SELECT * FROM programs ORDER BY sort_order ASC, name ASC`,
  ).all();
  return json({ items: results });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;
  const body = (await readJson(request)) as Record<string, unknown>;
  if (!body.slug || !body.name || !body.h1 || !body.short_desc) {
    return json({ error: "slug, name, h1, short_desc required" }, 400);
  }
  const result = await env.DB.prepare(
    `INSERT INTO programs
       (slug, name, kicker, h1, short_desc, long_desc, audience, season,
        key_details, image_url, cta_label, cta_target, published, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      String(body.slug),
      String(body.name),
      String(body.kicker ?? ""),
      String(body.h1),
      String(body.short_desc),
      String(body.long_desc ?? ""),
      String(body.audience ?? ""),
      String(body.season ?? ""),
      typeof body.key_details === "string" ? body.key_details : JSON.stringify(body.key_details ?? []),
      String(body.image_url ?? ""),
      String(body.cta_label ?? "Request info"),
      String(body.cta_target ?? "interest"),
      body.published === false ? 0 : 1,
      Number(body.sort_order ?? 100),
    )
    .run();
  return json({ ok: true, id: result.meta.last_row_id }, 201);
};
