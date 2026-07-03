import { json, readJson } from "../../../lib/http";
import { requireAdmin } from "../../../lib/access";
import type { Env } from "../../../lib/db";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;
  const { results = [] } = await env.DB.prepare(
    `SELECT * FROM league_events ORDER BY starts_at DESC`,
  ).all();
  return json({ items: results });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;
  const body = (await readJson(request)) as Record<string, unknown>;
  if (!body.title || !body.starts_at) return json({ error: "title and starts_at required" }, 400);
  const result = await env.DB.prepare(
    `INSERT INTO league_events
       (title, subtitle, description, starts_at, ends_at, location_line,
        image_url, cta_label, cta_url, published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      String(body.title),
      String(body.subtitle ?? ""),
      String(body.description ?? ""),
      String(body.starts_at),
      String(body.ends_at ?? ""),
      String(body.location_line ?? ""),
      String(body.image_url ?? ""),
      String(body.cta_label ?? "Sign up"),
      String(body.cta_url ?? "/league#signup"),
      body.published === false ? 0 : 1,
    )
    .run();
  return json({ ok: true, id: result.meta.last_row_id }, 201);
};
