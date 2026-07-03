import type { Env } from "./db";
import { escapeHtml } from "./http";

export async function sendEmail(args: {
  env: Env;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const { env, subject, html, replyTo } = args;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL,
      to: [env.CONTACT_TO_EMAIL],
      reply_to: replyTo ? [replyTo] : undefined,
      subject,
      html,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return res.json();
}

export function renderKv(pairs: Record<string, unknown>): string {
  const rows = Object.entries(pairs)
    .filter(([k, v]) => k !== "honeypot" && k !== "turnstileToken" && v !== "" && v != null)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;background:#f6f2e9;font-weight:600;font-family:system-ui">${escapeHtml(k)}</td><td style="padding:6px 12px;font-family:system-ui">${escapeHtml(String(v))}</td></tr>`,
    )
    .join("");
  return `<table cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e2ded3">${rows}</table>`;
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
