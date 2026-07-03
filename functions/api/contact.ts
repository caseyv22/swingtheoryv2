import { json, readJson, sendEmail, verifyTurnstile, renderKv, type Env } from "./_utils";
import { contactSchema } from "../../src/lib/validation";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readJson(request);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Please check your entries and try again." }, 400);
  }
  const data = parsed.data;
  if (data.honeypot) return json({ ok: true }); // Silent to bots

  const ip = request.headers.get("cf-connecting-ip");
  const ok = await verifyTurnstile(data.turnstileToken, env.TURNSTILE_SECRET_KEY, ip);
  if (!ok) return json({ error: "Verification failed. Try again." }, 400);

  try {
    await sendEmail({
      env,
      subject: `[Contact] ${data.name}`,
      replyTo: data.email,
      html: `<h2>New contact form submission</h2>${renderKv(data as unknown as Record<string, unknown>)}`,
    });
  } catch (e) {
    return json({ error: "Send failed. Try again in a moment." }, 500);
  }
  return json({ ok: true });
};
