import type { Env } from "./db";

// Mini Mulligans signup cap, configurable from the admin UI (see
// functions/api/admin/mm-waitlist/capacity.ts and the "Signup cap"
// control on AdminMMWaitlist.tsx) instead of the old hardcoded
// `CAPACITY = 18` constant duplicated across the public and admin
// waitlist endpoints. Single row, id fixed at 1
// (migrations/0009_mm_capacity_setting.sql).
//
// DEFAULT_CAPACITY covers two cases, both real: the settings row is
// missing (falls through the `??` below), and the whole table not
// existing yet because migrations/0009 hasn't been applied to this DB
// (D1 throws "no such table" rather than returning null, so that's
// caught explicitly). Either way this returns the same 18 the code used
// to hardcode, so a code deploy that lands before the migration runs
// degrades safely instead of 500ing every Mini Mulligans request.
const DEFAULT_CAPACITY = 18;

export async function getMmCapacity(env: Env): Promise<number> {
  try {
    const row = await env.DB.prepare(
      "SELECT capacity FROM mini_mulligans_settings WHERE id = 1",
    ).first<{ capacity: number }>();
    return row?.capacity ?? DEFAULT_CAPACITY;
  } catch (e) {
    console.error(
      `[mm-settings] capacity lookup failed, falling back to ${DEFAULT_CAPACITY}: ${
        e instanceof Error ? e.message : String(e)
      }`,
    );
    return DEFAULT_CAPACITY;
  }
}

export async function setMmCapacity(env: Env, capacity: number): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO mini_mulligans_settings (id, capacity, updated_at)
     VALUES (1, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET capacity = excluded.capacity, updated_at = excluded.updated_at`,
  )
    .bind(capacity)
    .run();
}
