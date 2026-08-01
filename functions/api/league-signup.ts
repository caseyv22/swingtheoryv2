import { json, readJson } from "../lib/http";
import { sendEmail, sendConfirmation, renderKv, verifyTurnstile, wrapBrandedEmail } from "../lib/email";
import { leagueConfirmation } from "../lib/confirmations";
import { logSubmission } from "../lib/submissions";
import { leagueSignupSchema } from "../../src/lib/validation";
import type { Env } from "../lib/db";

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
      subject: `[LEAGUE] ${data.name} · ${data.teamPreference || "?"}`,
      replyTo: data.email,
      html: wrapBrandedEmail({
        title: "New league signup",
        intro: "Someone signed up for the Swing Theory Golf League.",
        bodyHtml: renderKv(data as unknown as Record<string, unknown>),
      }),
    });
  } catch {
    return json({ error: "Send failed." }, 500);
  }

  // Customer-facing confirmation. Best-effort by design: the staff email and
  // the D1 log above are what actually matter, and the visitor has already
  // seen a success state, so a Resend hiccup here must never turn a good
  // submission into an error. sendConfirmation swallows and logs.
  //
  // Safe to send unconditionally at this point — the honeypot short-circuits
  // above and Turnstile has passed, so `data.email` is a human-supplied
  // address that cleared validation. Sending before those guards would turn
  // this endpoint into an open mail relay.
  const confirmation = leagueConfirmation(data);
  await sendConfirmation({ env, to: data.email, ...confirmation });

  await logSubmission({
    env,
    formType: "league",
    data: data as unknown as Record<string, unknown>,
    ip,
    userAgent: request.headers.get("user-agent"),
  });
  return json({ ok: true });
};
