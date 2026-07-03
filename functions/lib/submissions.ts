import type { Env } from "./db";

// Persist a submission to D1 after the email is (attempted) sent.
// We swallow DB errors on the write path so a DB blip never blocks the user.
export async function logSubmission(args: {
  env: Env;
  formType: "contact" | "event" | "league" | "membership" | "program";
  data: Record<string, unknown>;
  program?: string;
  ip: string | null;
  userAgent: string | null;
}) {
  const { env, formType, data, program, ip, userAgent } = args;
  try {
    await env.DB.prepare(
      `INSERT INTO submissions
        (form_type, program, name, email, phone, message, payload_json, user_ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        formType,
        program ?? "",
        String(data.name ?? ""),
        String(data.email ?? ""),
        String(data.phone ?? ""),
        String(data.message ?? ""),
        JSON.stringify(data),
        ip ?? "",
        userAgent ?? "",
      )
      .run();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("submission log failed", e);
  }
}
