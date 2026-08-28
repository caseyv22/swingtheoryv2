import { json, readJson } from "../lib/http";
import { sendEmail, sendConfirmation, renderKv, wrapBrandedEmail } from "../lib/email";
import { mmWaitlistConfirmation, mmWaitlistAlreadyOnList } from "../lib/confirmations";
import { logSubmission } from "../lib/submissions";
import { getMmCapacity } from "../lib/mm-settings";
import { miniMulligansWaitlistSchema } from "../../src/lib/validation";
import type { Env } from "../lib/db";

// Cap on total Mini Mulligans early-access signups is configurable from
// the admin UI now (functions/lib/mm-settings.ts / migrations/0009), not
// a hardcoded constant. Program is a small junior curriculum with
// limited instructor + bay coverage, 18 was the original number (roughly
// two full cohorts of 8 with a buffer for no-shows), but an admin can
// raise or lower it at /admin/mm-waitlist without a deploy.

// GET /api/mm-waitlist
// Public read of the current waitlist state so the form can render either
// "still open" or "full" without exposing the signup list itself. The
// endpoint is intentionally count-only — no PII returned to the browser.
// Cached at Cloudflare's edge for a short TTL so the /programs/mini-
// mulligans page doesn't hit D1 on every visitor; POST purges the cache
// by writing to D1 which invalidates through natural TTL rollover. Since
// the cap is 18 and staleness of a few seconds is inconsequential (the
// POST re-checks under a fresh count anyway), a slightly stale count is
// fine.
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const [row, capacity] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS c FROM mini_mulligans_waitlist").first<{
      c: number;
    }>(),
    getMmCapacity(env),
  ]);
  const count = row?.c ?? 0;
  return new Response(
    JSON.stringify({
      count,
      capacity,
      remaining: Math.max(0, capacity - count),
      isFull: count >= capacity,
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
        // Short TTL so an admin toggle-style change (or a POST) propagates
        // quickly. 30s is imperceptible for the counter but keeps D1 load
        // essentially zero at any traffic level we'll see this year.
        "cache-control": "public, max-age=30",
      },
    },
  );
};

// POST /api/mm-waitlist
// Add a parent to the early-access waitlist. Enforces:
//   1. Zod schema (fields + shapes + honeypot)
//   2. Capacity — reject with 409 when count >= the configurable cap
//      (functions/lib/mm-settings.ts)
//   3. Uniqueness — UNIQUE(email) at DB level; race-safe fallback for
//      concurrent inserts.
// Emails staff AND sends the signer a confirmation. Never returns 500
// unless something is genuinely broken.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readJson(request);
  const parsed = miniMulligansWaitlistSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Please check your entries." }, 400);
  const data = parsed.data;
  if (data.honeypot) return json({ ok: true }); // silently swallow bot signups

  const email = data.email.trim().toLowerCase();
  const kidAge = parseInt(data.kidAge, 10);
  if (!Number.isFinite(kidAge) || kidAge < 6 || kidAge > 13) {
    return json({ error: "Mini Mulligans is for ages 6–13. Please enter a valid age." }, 400);
  }

  // Capacity gate. Do the read fresh, don't trust the browser's earlier
  // GET — someone could have submitted between the visitor's page load
  // and their click. If the cap is hit, tell the client with 409 so the
  // form UI can flip to the "full" state.
  const [countRow, capacity] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS c FROM mini_mulligans_waitlist").first<{
      c: number;
    }>(),
    getMmCapacity(env),
  ]);
  const current = countRow?.c ?? 0;
  if (current >= capacity) {
    return json(
      {
        error: "The Mini Mulligans early-access waitlist is full. Email info@swingtheory.golf to be added to the overflow list.",
        code: "waitlist_full",
      },
      409,
    );
  }

  const ip = request.headers.get("cf-connecting-ip");

  // Pre-check for an existing reservation by email so a repeat submit
  // gets the friendly "already reserved" note instead of a raw
  // UNIQUE(email) conflict from the insert below.
  const already = await env.DB.prepare(
    "SELECT id FROM mini_mulligans_waitlist WHERE email = ?",
  )
    .bind(email)
    .first<{ id: number }>();
  if (already) {
    await sendConfirmation({
      env,
      to: email,
      ...mmWaitlistAlreadyOnList({ kidName: data.kidName }),
    });
    return json({ ok: true, alreadyOnList: true });
  }

  // No payment is collected here. Signups used to require a Square card
  // on file before the reservation would go through, and testing showed
  // that suppressed signups: people bailed at the card field even though
  // the copy said "won't be charged." Now the reservation is just the
  // form data below; a Swing Theory team member follows up to confirm the
  // spot (and, if the family continues after the free first session,
  // collects payment then — see functions/api/admin/mm-waitlist/[id].ts,
  // which already falls back to "collect payment in Square directly" for
  // rows with no card on file).
  try {
    await env.DB.prepare(
      `INSERT INTO mini_mulligans_waitlist
        (parent_name, email, kid_name, kid_age, phone, status)
       VALUES (?, ?, ?, ?, ?, 'reserved')`,
    )
      .bind(
        data.name,
        email,
        data.kidName,
        kidAge,
        data.phone || null,
      )
      .run();
  } catch (e) {
    const msg = String((e as Error)?.message || e).toLowerCase();
    if (msg.includes("unique")) {
      // Race: someone reserved this email between our pre-check and this
      // insert. Send the friendly "already reserved" note.
      await sendConfirmation({
        env,
        to: email,
        ...mmWaitlistAlreadyOnList({ kidName: data.kidName }),
      });
      return json({ ok: true, alreadyOnList: true });
    }
    // Anything else is a real DB error.
    console.error(`[mm-waitlist] insert failed: ${msg}`);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }

  // Staff notification, best-effort. The DB insert already succeeded so
  // an email hiccup can't roll back the signup — swallow and continue.
  try {
    await sendEmail({
      env,
      subject: `[MM-REGISTRATION] ${data.name} · ${data.kidName} (age ${kidAge})`,
      replyTo: data.email,
      html: wrapBrandedEmail({
        title: "New Mini Mulligans registration",
        intro: `${data.name} registered ${data.kidName} for Mini Mulligans. That's #${current + 1} of ${capacity} spots filled.`,
        bodyHtml: renderKv({
          parent: data.name,
          email: data.email,
          phone: data.phone || "",
          child: data.kidName,
          childAge: String(kidAge),
          position: `${current + 1} / ${capacity}`,
        }),
      }),
    });
  } catch {
    // swallow, see comment above
  }

  // Parent-facing confirmation. Same best-effort contract as the staff
  // notification above: the row is already committed, so a send failure
  // must not surface to the parent.
  //
  // Note we deliberately do NOT include the "#n of 18" position here. It's
  // in the staff email because it's operationally useful, but telling a
  // parent they're 17th of 18 reads as bad news, and telling them they're
  // 2nd of 18 reads as "nobody wants this."
  await sendConfirmation({
    env,
    to: email,
    ...mmWaitlistConfirmation({
      name: data.name,
      kidName: data.kidName,
      kidAge,
    }),
  });

  // Log to the shared submissions table so admin's existing Submissions
  // page surfaces waitlist signups too, no new admin route needed.
  await logSubmission({
    env,
    formType: "mm-waitlist",
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || "",
      message: `Mini Mulligans registration: kid=${data.kidName}, age=${kidAge}, position=${current + 1}/${capacity}`,
      kidName: data.kidName,
      kidAge,
      position: current + 1,
    },
    program: "Mini Mulligans",
    ip,
    userAgent: request.headers.get("user-agent"),
  });

  return json({
    ok: true,
    position: current + 1,
    capacity,
  });
};
