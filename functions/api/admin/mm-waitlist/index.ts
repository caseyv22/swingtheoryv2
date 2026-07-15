import { json, readJson } from "../../../lib/http";
import { requireAdmin } from "../../../lib/access";
import type { Env } from "../../../lib/db";

// Same capacity constant as the public /api/mm-waitlist endpoint. Kept in
// sync manually — if the cap ever changes, update both. Not a config row
// because the frontend already displays the number ("18 spots") in copy
// too and we don't want copy drift.
const CAPACITY = 18;

// GET /api/admin/mm-waitlist
// Returns the full ordered waitlist with a computed position column so the
// admin table can show "1 / 18", "2 / 18", etc. No hiding of PII here —
// the endpoint sits behind Cloudflare Access.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;

  type Row = {
    id: number;
    parent_name: string;
    email: string;
    kid_name: string;
    kid_age: number;
    phone: string | null;
    created_at: string;
  };
  const { results = [] } = await env.DB.prepare(
    `SELECT id, parent_name, email, kid_name, kid_age, phone, created_at
       FROM mini_mulligans_waitlist
      ORDER BY created_at ASC`,
  ).all<Row>();

  return json({
    items: results.map((row, i) => ({ ...row, position: i + 1 })),
    total: results.length,
    capacity: CAPACITY,
    remaining: Math.max(0, CAPACITY - results.length),
    isFull: results.length >= CAPACITY,
  });
};

// POST /api/admin/mm-waitlist
// Manual add — someone emailed / called and needs to be on the list, or
// an admin is populating overflow. Same shape as the public POST but no
// honeypot and no email confirmation (admin knows what they're doing).
// Still enforces:
//   - capacity cap (409 if full)
//   - UNIQUE(email) — 409 if the email is already on the list
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;

  const body = (await readJson(request)) as {
    parent_name?: string;
    email?: string;
    kid_name?: string;
    kid_age?: number | string;
    phone?: string;
  };

  const parentName = String(body.parent_name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const kidName = String(body.kid_name ?? "").trim();
  const kidAge = Number.parseInt(String(body.kid_age ?? ""), 10);
  const phone = body.phone ? String(body.phone).trim() : null;

  if (!parentName) return json({ error: "Parent name required" }, 400);
  if (!email || !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email))
    return json({ error: "Valid email required" }, 400);
  if (!kidName) return json({ error: "Kid name required" }, 400);
  if (!Number.isFinite(kidAge) || kidAge < 3 || kidAge > 18)
    return json({ error: "Kid age must be a number between 3 and 18" }, 400);

  const countRow = await env.DB.prepare(
    `SELECT COUNT(*) AS c FROM mini_mulligans_waitlist`,
  ).first<{ c: number }>();
  if ((countRow?.c ?? 0) >= CAPACITY) {
    return json(
      { error: `Waitlist is full (${CAPACITY} of ${CAPACITY}).`, code: "waitlist_full" },
      409,
    );
  }

  try {
    const result = await env.DB.prepare(
      `INSERT INTO mini_mulligans_waitlist
         (parent_name, email, kid_name, kid_age, phone)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id`,
    )
      .bind(parentName, email, kidName, kidAge, phone)
      .first<{ id: number }>();
    return json({ ok: true, id: result?.id });
  } catch (e) {
    const msg = String((e as Error)?.message || e).toLowerCase();
    if (msg.includes("unique")) {
      return json({ error: "That email is already on the waitlist." }, 409);
    }
    console.error(`[admin/mm-waitlist] insert failed: ${msg}`);
    return json({ error: "Insert failed." }, 500);
  }
};
