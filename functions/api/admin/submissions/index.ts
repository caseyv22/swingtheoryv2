import { json } from "../../../lib/http";
import { requireAdmin } from "../../../lib/access";
import type { Env } from "../../../lib/db";

const ALLOWED_TYPES = new Set(["contact", "event", "league", "membership", "program"]);
const ALLOWED_STATUS = new Set(["new", "read", "archived"]);

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 500);
  const offset = Number(url.searchParams.get("offset") ?? 0);

  const wheres: string[] = [];
  const binds: unknown[] = [];
  if (type && ALLOWED_TYPES.has(type)) {
    wheres.push(`form_type = ?`);
    binds.push(type);
  }
  if (status && ALLOWED_STATUS.has(status)) {
    wheres.push(`status = ?`);
    binds.push(status);
  }
  const whereSql = wheres.length ? `WHERE ${wheres.join(" AND ")}` : "";

  const { results = [] } = await env.DB.prepare(
    `SELECT id, form_type, program, name, email, phone, message,
            user_ip, user_agent, status, created_at
     FROM submissions
     ${whereSql}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
  )
    .bind(...binds, limit, offset)
    .all();

  const count = await env.DB.prepare(
    `SELECT COUNT(*) as n FROM submissions ${whereSql}`,
  )
    .bind(...binds)
    .first<{ n: number }>();

  return json({ items: results, total: count?.n ?? 0, limit, offset });
};
