// Shared helpers for Pages Functions.

export type Env = {
  RESEND_API_KEY: string;
  CONTACT_TO_EMAIL: string;
  CONTACT_FROM_EMAIL: string;
  TURNSTILE_SECRET_KEY?: string;
};

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Cloudflare Turnstile server-side verification. */
export async function verifyTurnstile(
  token: string | undefined,
  secret: string | undefined,
  ip: string | null,
): Promise<boolean> {
  if (!secret) return true; // Not configured — skip in dev
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

type SendArgs = {
  env: Env;
  subject: string;
  html: string;
  replyTo?: string;
};

export async function sendEmail({ env, subject, html, replyTo }: SendArgs) {
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
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend error: ${res.status} ${text}`);
  }
  return res.json();
}

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
