import { json } from "../lib/http";
import type { Env } from "../lib/db";

// POST /api/analyze-email
//
// Replacement for the old WordPress `swing_theory_send_email` admin-ajax
// handler. Receives the multipart/form-data payload sent by
// public/analyze/index.html after the user clicks "Send Report", composes
// the same HTML email the PHP handler built (stat cards, mini charts,
// AI Coach summary, optional tip, CTA), attaches the PDF the frontend
// generated with jsPDF, and sends via Resend to the user's inbox.
//
// Fields (see the submitEmail() JS in analyze/index.html):
//   to_email, date, time, total_shots, clubs, stat_rows (JSON), aoa_counts
//   ("a,b,c,d,e"), shape_counts ("draw,straight,fade"), avg_smash,
//   std_offline, ai_summary, tip_label, tip_text, pdf_attachment (base64)
//
// Response: { ok: true } on success, { error: "..." } with 4xx/5xx status
// on failure. The frontend expects a `success` field on the JSON in the
// happy path — we mirror the WP `wp_send_json_success` shape.

// Escape user-supplied text for interpolation into HTML. Regex form of
// replace with the /g flag because the repo's tsconfig lib doesn't include
// ES2021 String.prototype.replaceAll.
function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Newline → <br> for AI summary / tip text where the model returns
// paragraph-formatted plain text.
function nl2br(s: string): string {
  return esc(s).replace(/\r?\n/g, "<br />");
}

// ─── Chart builders (email-safe, all inline CSS + <table>) ────────────────
// These mirror the four PHP functions in the original WPCode snippet
// verbatim, so the emailed report looks identical to what customers were
// receiving from the WordPress site.

function aoaChart(counts: number[]): string {
  const labels = ["< -6", "-6 to -3", "-3 to 0", "0 to +3", "> +3"];
  const colors = ["#c0392b", "#b07a10", "#2a7a3c", "#2a7a3c", "#b07a10"];
  const max = Math.max(...counts, 1);
  let out = '<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;">';
  out +=
    '<tr><td colspan="5" style="font-size:11px;font-weight:700;color:#064029;font-family:Arial,sans-serif;padding-bottom:10px;letter-spacing:1px;text-transform:uppercase;">Attack Angle Distribution</td></tr>';
  out += '<tr style="vertical-align:bottom;">';
  counts.forEach((count, i) => {
    const pct = count === 0 ? 2 : Math.max(4, Math.round((count / max) * 80));
    out += `<td width="18%" style="text-align:center;vertical-align:bottom;padding:0 2px;">`;
    out += `<div style="font-size:10px;font-weight:bold;color:${colors[i]};font-family:Arial,sans-serif;margin-bottom:3px;">${count}</div>`;
    out += `<div style="background:${colors[i]};height:${pct}px;border-radius:3px 3px 0 0;"></div>`;
    out += `</td>`;
  });
  out += "</tr><tr>";
  labels.forEach((label) => {
    out += `<td width="18%" style="text-align:center;padding:4px 2px 0;font-size:9px;color:#666666;font-family:Arial,sans-serif;">${esc(label)}</td>`;
  });
  out += "</tr></table>";
  return out;
}

function shapeChart(draw: number, straight: number, fade: number): string {
  const total = Math.max(draw + straight + fade, 1);
  const data: Array<[string, number, string]> = [
    ["Draw", draw, "#2a7a3c"],
    ["Straight", straight, "#aaaaaa"],
    ["Fade", fade, "#b07a10"],
  ];
  let out = '<table width="100%" cellpadding="0" cellspacing="0">';
  out +=
    '<tr><td colspan="2" style="font-size:11px;font-weight:700;color:#064029;font-family:Arial,sans-serif;padding-bottom:10px;letter-spacing:1px;text-transform:uppercase;">Shot Shape</td></tr>';
  for (const [label, count, color] of data) {
    const pct = Math.round((count / total) * 100);
    const barPct = Math.max(2, pct);
    out += `<tr><td style="padding:3px 0;">`;
    out += `<div style="font-size:10px;color:#444444;font-family:Arial,sans-serif;margin-bottom:3px;">${esc(label)} &nbsp;<span style="color:${color};font-weight:bold;">${count} (${pct}%)</span></div>`;
    out += `<div style="background:#e8e8e8;border-radius:3px;height:10px;width:100%;">`;
    out += `<div style="background:${color};border-radius:3px;height:10px;width:${barPct}%;"></div>`;
    out += `</div></td></tr>`;
  }
  out += "</table>";
  return out;
}

function smashChart(smash: number): string {
  // 0.80 → 1.50 range, mapped to a 0–100% bar.
  const pct = Math.max(0, Math.min(100, Math.round(((smash - 0.8) / 0.7) * 100)));
  const color = smash >= 1.45 ? "#064029" : smash >= 1.35 ? "#b07a10" : "#c0392b";
  const label = smash >= 1.45 ? "Excellent" : smash >= 1.35 ? "Good" : "Needs Work";
  let out = '<table width="100%" cellpadding="0" cellspacing="0">';
  out +=
    '<tr><td style="font-size:11px;font-weight:700;color:#064029;font-family:Arial,sans-serif;padding-bottom:10px;letter-spacing:1px;text-transform:uppercase;">Smash Factor</td></tr>';
  out += "<tr><td>";
  out += `<div style="font-size:38px;font-weight:700;color:${color};font-family:Arial,sans-serif;line-height:1;">${smash.toFixed(2)}</div>`;
  out += `<div style="font-size:11px;color:#666666;font-family:Arial,sans-serif;margin-bottom:10px;">${label}</div>`;
  out += `<div style="background:#e0e0e0;border-radius:4px;height:10px;width:100%;margin-bottom:6px;">`;
  out += `<div style="background:${color};border-radius:4px;height:10px;width:${pct}%;"></div>`;
  out += "</div>";
  out += `<table width="100%" cellpadding="0" cellspacing="0"><tr>`;
  out += `<td style="font-size:9px;color:#999999;font-family:Arial,sans-serif;">0.80 Poor</td>`;
  out += `<td style="font-size:9px;color:#999999;font-family:Arial,sans-serif;text-align:center;">1.15 Avg</td>`;
  out += `<td style="font-size:9px;color:#999999;font-family:Arial,sans-serif;text-align:right;">1.50 Elite</td>`;
  out += "</tr></table></td></tr></table>";
  return out;
}

function consistencyChart(stdOffline: number): string {
  const score = Math.max(0, Math.min(100, Math.round(100 - stdOffline * 2)));
  const color = score >= 80 ? "#064029" : score >= 60 ? "#b07a10" : "#c0392b";
  const label =
    score >= 80 ? "Excellent" : score >= 70 ? "Strong" : score >= 60 ? "Average" : "Needs Work";
  let out = '<table width="100%" cellpadding="0" cellspacing="0">';
  out +=
    '<tr><td style="font-size:11px;font-weight:700;color:#064029;font-family:Arial,sans-serif;padding-bottom:10px;letter-spacing:1px;text-transform:uppercase;">Consistency Score</td></tr>';
  out += "<tr><td>";
  out += `<div style="font-size:38px;font-weight:700;color:${color};font-family:Arial,sans-serif;line-height:1;">${score}</div>`;
  out += `<div style="font-size:11px;color:#666666;font-family:Arial,sans-serif;margin-bottom:10px;">${label} &nbsp;&bull;&nbsp; out of 100</div>`;
  out += `<div style="background:#e0e0e0;border-radius:4px;height:10px;width:100%;margin-bottom:6px;">`;
  out += `<div style="background:${color};border-radius:4px;height:10px;width:${score}%;"></div>`;
  out += "</div>";
  out += `<table width="100%" cellpadding="0" cellspacing="0"><tr>`;
  out += `<td style="font-size:9px;color:#999999;font-family:Arial,sans-serif;">0 Scattered</td>`;
  out += `<td style="font-size:9px;color:#999999;font-family:Arial,sans-serif;text-align:center;">50 Average</td>`;
  out += `<td style="font-size:9px;color:#999999;font-family:Arial,sans-serif;text-align:right;">100 Laser</td>`;
  out += "</tr></table></td></tr></table>";
  return out;
}

// Build the stat-row grid (3 cards per row) that goes right under the
// session-meta pill. Matches the PHP $stat_rows_html construction.
function statRowsHtml(rows: string[][]): string {
  const chunks: string[][][] = [];
  for (let i = 0; i < rows.length; i += 3) chunks.push(rows.slice(i, i + 3));
  return chunks
    .map((chunk) => {
      const cells = chunk
        .map(
          (row) => `
        <td style="width:33%;padding:16px 12px;text-align:center;border-right:1px solid #eaf3ec;">
          <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#888888;margin-bottom:6px;">${esc(row[0])}</div>
          <div style="font-size:26px;font-weight:700;color:#064029;line-height:1;font-family:Arial,sans-serif;">${esc(row[1])}</div>
          <div style="font-size:11px;color:#666666;margin-top:4px;">${esc(row[2])}</div>
        </td>`,
        )
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
}

// Full email HTML — mirrors the PHP template line-for-line.
function buildEmailHtml(args: {
  date: string;
  time: string;
  totalShots: number;
  clubs: string;
  statRows: string[][];
  aoaCounts: number[];
  drawCount: number;
  straightCount: number;
  fadeCount: number;
  avgSmash: number;
  stdOffline: number;
  aiSummary: string;
  tipLabel: string;
  tipText: string;
}): string {
  const tipSection =
    args.tipLabel && args.tipText
      ? `
    <div style="background:#f7faf8;border-left:4px solid #064029;border-radius:0 8px 8px 0;padding:20px 24px;margin-top:24px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#064029;margin-bottom:10px;">${esc(args.tipLabel)}</div>
      <p style="font-size:14px;line-height:1.75;color:#3d3d3d;margin:0;">${nl2br(args.tipText)}</p>
    </div>`
      : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
</head>
<body style="margin:0;padding:0;background:#f0f4f1;font-family:Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;color:#f0f4f1;">Review your golf session from today! &#847; &#847; &#847; &#847; &#847; &#847;</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f1;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;">
  <tr>
    <td style="background:#064029;padding:24px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:middle;">
            <img src="https://swingtheory.golf/wp-content/uploads/2025/03/Wide-Asset-3-copy.png" alt="Swing Theory" height="36" style="display:block;height:36px;" />
          </td>
          <td style="text-align:right;vertical-align:middle;">
            <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.7);">Session Report</div>
            <div style="font-size:13px;color:#ffffff;margin-top:4px;">${esc(args.date)} at ${esc(args.time)}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 32px 0;border-bottom:1px solid #eaf3ec;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-bottom:16px;">
            <span style="background:#e8f4eb;color:#064029;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;">${args.totalShots} Total Shots</span>
            <span style="margin-left:8px;font-size:13px;color:#666666;">${esc(args.clubs)}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 32px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#064029;margin-bottom:16px;">Key Metrics</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d8e8dc;border-radius:12px;overflow:hidden;">
        ${statRowsHtml(args.statRows)}
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:0 32px 24px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#064029;margin-bottom:16px;">Shot Analysis</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-right:8px;vertical-align:top;width:50%;padding-bottom:8px;">
            <div style="background:#f7faf8;border:1px solid #d8e8dc;border-radius:12px;padding:16px;min-height:160px;">
              ${aoaChart(args.aoaCounts)}
            </div>
          </td>
          <td style="vertical-align:top;width:50%;padding-bottom:8px;">
            <div style="background:#f7faf8;border:1px solid #d8e8dc;border-radius:12px;padding:16px;min-height:160px;">
              ${shapeChart(args.drawCount, args.straightCount, args.fadeCount)}
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding-right:8px;vertical-align:top;width:50%;">
            <div style="background:#f7faf8;border:1px solid #d8e8dc;border-radius:12px;padding:16px;min-height:160px;">
              ${smashChart(args.avgSmash)}
            </div>
          </td>
          <td style="vertical-align:top;width:50%;">
            <div style="background:#f7faf8;border:1px solid #d8e8dc;border-radius:12px;padding:16px;min-height:160px;">
              ${consistencyChart(args.stdOffline)}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:0 32px 24px;">
      <div style="background:#ffffff;border:1px solid #d8e8dc;border-radius:12px;padding:24px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#064029;margin-bottom:12px;">AI Coach Session Summary</div>
        <p style="font-size:14px;line-height:1.75;color:#1a1a1a;margin:0;">${nl2br(args.aiSummary)}</p>
        ${tipSection}
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding:0 32px 32px;text-align:center;">
      <a href="https://booking.registrygolf.com?organizationId=639ff740-1b51-4959-99af-19ac2d069609" style="display:inline-block;background:#064029;color:#ffffff;font-size:14px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">Book Your Next Session</a>
    </td>
  </tr>
  <tr>
    <td style="background:#f7faf8;border-top:1px solid #eaf3ec;padding:20px 32px;text-align:center;">
      <p style="font-size:11px;color:#999999;margin:0;">Swing Theory &mdash; 50 S De Lacey Ave, Pasadena, CA 91105</p>
      <p style="font-size:11px;color:#999999;margin:6px 0 0;">626-879-5513 &nbsp;&bull;&nbsp; info@swingtheory.golf &nbsp;&bull;&nbsp; swingtheory.golf</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// Very forgiving email format check — matches the JS-side validation on
// analyze/index.html (must have a @ + a TLD of at least 2 letters).
function looksLikeEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(s);
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Malformed request." }, 400);
  }

  const toEmail = String(form.get("to_email") ?? "").trim();
  if (!looksLikeEmail(toEmail)) {
    return json({ error: "Please enter a valid email address." }, 400);
  }

  const date = String(form.get("date") ?? "");
  const time = String(form.get("time") ?? "");
  const totalShots = parseInt(String(form.get("total_shots") ?? "0"), 10) || 0;
  const clubs = String(form.get("clubs") ?? "");

  let statRows: string[][] = [];
  try {
    const parsed = JSON.parse(String(form.get("stat_rows") ?? "[]"));
    if (Array.isArray(parsed)) statRows = parsed;
  } catch {
    // Empty array is a safe fallback — the email just won't render stats.
  }

  const aoaCountsRaw = String(form.get("aoa_counts") ?? "0,0,0,0,0");
  const aoaCounts = aoaCountsRaw.split(",").map((v) => parseInt(v, 10) || 0);
  // Pad to 5 buckets in case the client sent something short.
  while (aoaCounts.length < 5) aoaCounts.push(0);

  const shapeCountsRaw = String(form.get("shape_counts") ?? "0,0,0");
  const [drawCount, straightCount, fadeCount] = shapeCountsRaw
    .split(",")
    .map((v) => parseInt(v, 10) || 0);

  const avgSmash = parseFloat(String(form.get("avg_smash") ?? "0")) || 0;
  const stdOffline = parseFloat(String(form.get("std_offline") ?? "0")) || 0;
  const aiSummary = String(form.get("ai_summary") ?? "");
  const tipLabel = String(form.get("tip_label") ?? "");
  const tipText = String(form.get("tip_text") ?? "");
  const pdfBase64 = String(form.get("pdf_attachment") ?? "").trim();

  const html = buildEmailHtml({
    date,
    time,
    totalShots,
    clubs,
    statRows,
    aoaCounts,
    drawCount: drawCount ?? 0,
    straightCount: straightCount ?? 0,
    fadeCount: fadeCount ?? 0,
    avgSmash,
    stdOffline,
    aiSummary,
    tipLabel,
    tipText,
  });

  // Resend send. Uses the same RESEND_API_KEY the rest of the site
  // already relies on. From address matches the old WP header exactly.
  const payload: Record<string, unknown> = {
    from: "Swing Theory - Premier Indoor Golf Experience <info@swingtheory.golf>",
    to: [toEmail],
    subject: `Your Golf Session Report - ${date}`,
    html,
  };

  // PDF attachment, best-effort. If the client couldn't render the PDF the
  // field is empty and we skip attaching — the email still ships with the
  // full HTML report.
  if (pdfBase64.length > 0) {
    payload.attachments = [
      {
        filename: `session-report-${Date.now()}.pdf`,
        content: pdfBase64,
      },
    ];
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      console.error(`[analyze-email] resend ${res.status}: ${bodyText}`);
      return json(
        { error: "Email could not be sent. Please try again." },
        502,
      );
    }
  } catch (e) {
    console.error(`[analyze-email] resend fetch failed: ${(e as Error).message}`);
    return json({ error: "Email could not be sent. Please try again." }, 502);
  }

  // Mirror the old WP `wp_send_json_success` response shape so the
  // frontend's `if (data.success)` check keeps working unchanged.
  return json({ success: true, message: "Email sent successfully." });
};
