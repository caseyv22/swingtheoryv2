import type { Env } from "./db";
import { escapeHtml } from "./http";

export async function sendEmail(args: {
  env: Env;
  subject: string;
  html: string;
  replyTo?: string;
  // Recipient override. Defaults to CONTACT_TO_EMAIL (staff) so every
  // pre-existing call site keeps its exact behaviour. Customer-facing
  // confirmations pass the submitter's address here — go through
  // sendConfirmation() below rather than calling this directly.
  to?: string;
}) {
  const { env, subject, html, replyTo, to } = args;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL,
      to: [to || env.CONTACT_TO_EMAIL],
      reply_to: replyTo ? [replyTo] : undefined,
      subject,
      html,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return res.json();
}

/**
 * Customer-facing confirmation. Deliberately different from sendEmail():
 *
 *  1. NEVER THROWS. By the time a confirmation is sent the submission has
 *     already succeeded — the row is in D1, the card is charged. A Resend
 *     outage must not surface to the customer as a failed signup, so this
 *     swallows and logs instead of propagating.
 *  2. reply_to is CONTACT_TO_EMAIL, not noreply. Mail goes out from
 *     CONTACT_FROM_EMAIL (noreply@), and several of these templates
 *     explicitly invite a reply ("reply with your second member's name").
 *     Without this, those replies vanish.
 *
 * Returns true/false so callers can record the outcome in their staff
 * notification without branching on exceptions.
 */
export async function sendConfirmation(args: {
  env: Env;
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  try {
    await sendEmail({
      env: args.env,
      to: args.to,
      subject: args.subject,
      html: args.html,
      replyTo: args.env.CONTACT_TO_EMAIL,
    });
    return true;
  } catch (e) {
    console.error(
      `[confirmation] send failed: ${e instanceof Error ? e.message : String(e)}`,
    );
    return false;
  }
}

export function renderKv(pairs: Record<string, unknown>): string {
  const rows = Object.entries(pairs)
    .filter(([k, v]) => k !== "honeypot" && k !== "turnstileToken" && v !== "" && v != null)
    .map(
      ([k, v]) => `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #eaf3ec">
      <span style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#888888">${escapeHtml(k)}</span>
      <span style="font-size:14px;color:#1a1a1a;font-weight:600;margin-left:12px">${escapeHtml(String(v))}</span>
    </td>
  </tr>`,
    )
    .join("");
  return `<div style="background:#f7faf8;border:1px solid #d8e8dc;border-radius:12px;padding:4px 24px">
        <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      </div>`;
}

/**
 * Wraps inner content (e.g. renderKv output) in the branded Swing Theory
 * email shell, dark green header with logo, white card body, NAP footer.
 * Matches the look used for Swing Sync account emails.
 */
export function wrapBrandedEmail(args: {
  title: string;
  intro?: string;
  bodyHtml: string;
  preheader?: string;
}): string {
  const { title, intro = "", bodyHtml, preheader = title } = args;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
</head>
<body style="margin:0;padding:0;background:#f0f4f1;font-family:Arial,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;color:#f0f4f1">${escapeHtml(preheader)}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f1;padding:32px 16px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden">
  <tr>
    <td style="background:#064029;padding:24px 32px">
      <img src="https://media.swingtheory.golf/uploads/email-logo.png" alt="Swing Theory" height="36" style="display:block;height:36px;">
    </td>
  </tr>
  <tr>
    <td style="padding:32px 32px 8px">
      <div style="font-size:22px;font-weight:700;color:#064029;margin-bottom:8px">${escapeHtml(title)}</div>
      ${intro ? `<p style="font-size:14px;color:#555555;line-height:1.6;margin:0">${escapeHtml(intro)}</p>` : ""}
    </td>
  </tr>
  <tr>
    <td style="padding:16px 32px 32px">
      ${bodyHtml}
    </td>
  </tr>
  <tr>
    <td style="background:#f7faf8;border-top:1px solid #eaf3ec;padding:20px 32px;text-align:center">
      <p style="font-size:11px;color:#999999;margin:0">Swing Theory, 50 S De Lacey Ave, Pasadena, CA 91105</p>
      <p style="font-size:11px;color:#999999;margin:6px 0 0">626-879-5513 &nbsp;•&nbsp; info@swingtheory.golf &nbsp;•&nbsp; swingtheory.golf</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function verifyTurnstile(
  token: string | undefined,
  secret: string | undefined,
  ip: string | null,
): Promise<boolean> {
  if (!secret) return true;
  if (!token) return false;
  const form = new URLSearchParams();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  const data = (await res.json()) as { success?: boolean };
  return !!data.success;
}
