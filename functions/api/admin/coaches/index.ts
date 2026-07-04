import { json, readJson, safeJsonArray } from "../../../lib/http";
import { requireAdmin } from "../../../lib/access";
import type { Env } from "../../../lib/db";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;
  const { results = [] } = await env.DB.prepare(
    `SELECT * FROM coaches ORDER BY sort_order ASC, name ASC`,
  ).all<Record<string, unknown>>();
  return json({
    items: results.map((r) => ({ ...r, specialties: safeJsonArray(r.specialties) })),
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;
  const body = (await readJson(request)) as Record<string, unknown>;
  if (!body.slug || !body.name) return json({ error: "slug and name required" }, 400);
  const result = await env.DB.prepare(
    `INSERT INTO coaches
       (slug, name, title, bio, photo_url, specialties, phone, email, published, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      String(body.slug),
      String(body.name),
      String(body.title ?? ""),
      String(body.bio ?? ""),
      String(body.photo_url ?? ""),
      typeof body.specialties === "string" ? body.specialties : JSON.stringify(body.specialties ?? []),
      String(body.phone ?? ""),
      String(body.email ?? ""),
      body.published === false ? 0 : 1,
      Number(body.sort_order ?? 100),
    )
    .run();
  return json({ ok: true, id: result.meta.last_row_id }, 201);
};
