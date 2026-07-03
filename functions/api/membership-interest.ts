import { json, readJson } from "../lib/http";
import { sendEmail, renderKv, verifyTurnstile, wrapBrandedEmail } from "../lib/email";
import { logSubmission } from "../lib/submissions";
import { membershipInterestSchema } from "../../src/lib/validation";
import type { Env } from "../lib/db";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readJson(request);
  const parsed = membershipInterestSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Please check your entries." }, 400);
  const data = parsed.data;
  if (data.honeypot) return json({ ok: true });

  const ip = request.headers.get("cf-connecting-ip");
  const ok = await verifyTurnstile(data.turnstileToken, env.TURNSTILE_SECRET_KEY, ip);
  if (!ok) return json({ error: "Verification failed." }, 400);

  try {
    await sendEmail({
      env,
      subject: `[MEMBERSHIP] ${data.name} — ${data.interest || "?"}`,
      replyTo: data.email,
      html: wrapBrandedEmail({
        title: "Membership interest",
        intro: "Someone requested info about a Green Jacket membership.",
        bodyHtml: renderKv(data as unknown as Record<string, unknown>),
      }),
    });
  } catch {
    return json({ error: "Send failed." }, 500);
  }
  await logSubmission({
    env,
    formType: "membership",
    data: data as unknown as Record<string, unknown>,
    ip,
    userAgent: request.headers.get("user-agent"),
  });
  return json({ ok: true });
};
