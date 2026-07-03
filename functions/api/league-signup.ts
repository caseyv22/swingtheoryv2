import { json, readJson, sendEmail, verifyTurnstile, renderKv, type Env } from "./_utils";
import { leagueSignupSchema } from "../../src/lib/validation";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readJson(request);
  const parsed = leagueSignupSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Please check your entries." }, 400);
  const data = parsed.data;
  if (data.honeypot) return json({ ok: true });

  const ip = request.headers.get("cf-connecting-ip");
  const ok = await verifyTurnstile(data.turnstileToken, env.TURNSTILE_SECRET_KEY, ip);
  if (!ok) return json({ error: "Verification failed." }, 400);

  try {
    await sendEmail({
      env,
      subject: `[LEAGUE] ${data.name} — ${data.teamPreference || "?"}`,
      replyTo: data.email,
      html: `<h2>New league signup</h2>${renderKv(data as unknown as Record<string, unknown>)}`,
    });
  } catch {
    return json({ error: "Send failed." }, 500);
  }
  return json({ ok: true });
};
