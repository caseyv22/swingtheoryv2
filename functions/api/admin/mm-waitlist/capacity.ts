import { json, readJson } from "../../../lib/http";
import { requireAdmin } from "../../../lib/access";
import { getMmCapacity, setMmCapacity } from "../../../lib/mm-settings";
import type { Env } from "../../../lib/db";

// GET/PATCH /api/admin/mm-waitlist/capacity
// Lets an admin raise or lower the Mini Mulligans signup cap from the UI
// (see the "Signup cap" control on AdminMMWaitlist.tsx) instead of a
// code change + deploy. Kept as its own route rather than folded into
// the list GET/POST in ./index.ts so the admin page can update just the
// cap without resubmitting the whole waitlist payload.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;
  return json({ capacity: await getMmCapacity(env) });
};

export const onRequestPatch: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;

  const body = (await readJson(request)) as { capacity?: number | string };
  const capacity = Number.parseInt(String(body.capacity ?? ""), 10);
  // 0 is allowed on purpose — it's how an admin pauses new signups
  // without pulling the sign-up form off the page (existing "full"
  // messaging just kicks in). Upper-bounded at 200 so a typo doesn't
  // silently open the program to far more families than the instructor
  // and bay coverage can actually support.
  if (!Number.isFinite(capacity) || capacity < 0 || capacity > 200) {
    return json({ error: "Capacity must be a number between 0 and 200." }, 400);
  }

  await setMmCapacity(env, capacity);
  return json({ ok: true, capacity });
};
