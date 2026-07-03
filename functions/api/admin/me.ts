import { json } from "../../lib/http";
import { requireAdmin } from "../../lib/access";
import type { Env } from "../../lib/db";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;
  return json({ user });
};
