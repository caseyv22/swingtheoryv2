import { requireAdmin } from "../../../lib/access";
import type { Env } from "../../../lib/db";

// CSV export. Filter by ?type=xxx&status=yyy.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status");

  const wheres: string[] = [];
  const binds: unknown[] = [];
  if (type) {
    wheres.push("form_type = ?");
    binds.push(type);
  }
  if (status) {
    wheres.push("status = ?");
    binds.push(status);
  }
  const whereSql = wheres.length ? `WHERE ${wheres.join(" AND ")}` : "";

  const { results = [] } = await env.DB.prepare(
    `SELECT id, form_type, program, name, email, phone, message, status, created_at
     FROM submissions
     ${whereSql}
     ORDER BY created_at DESC`,
  )
    .bind(...binds)
    .all<Record<string, unknown>>();

  const headers = ["id", "form_type", "program", "name", "email", "phone", "message", "status", "created_at"];
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const rows = results.map((r) => headers.map((h) => escape(r[h])).join(","));
  const csv = [headers.join(","), ...rows].join("\n");

  const stamp = new Date().toISOString().split("T")[0];
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="submissions-${stamp}.csv"`,
    },
  });
};
