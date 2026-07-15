import { json } from "../../../lib/http";
import { requireAdmin } from "../../../lib/access";
import type { Env } from "../../../lib/db";

// DELETE /api/admin/mm-waitlist/:id
// Removes a waitlist entry entirely. Frees up their slot in the 18-cap so
// the next signup succeeds. No soft delete — no reason to keep a
// deactivated row around on such a small dataset, and hard delete keeps
// the position numbers meaningful.
export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;

  const id = Number.parseInt(String(params.id ?? ""), 10);
  if (!Number.isFinite(id)) return json({ error: "Invalid id" }, 400);

  const res = await env.DB.prepare(
    `DELETE FROM mini_mulligans_waitlist WHERE id = ?`,
  )
    .bind(id)
    .run();

  if (res.meta.changes === 0) return json({ error: "Not found" }, 404);
  return json({ ok: true });
};
