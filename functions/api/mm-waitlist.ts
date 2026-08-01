import { json, readJson } from "../lib/http";
import { sendEmail, sendConfirmation, renderKv, wrapBrandedEmail } from "../lib/email";
import { mmWaitlistConfirmation, mmWaitlistAlreadyOnList } from "../lib/confirmations";
import { logSubmission } from "../lib/submissions";
import { miniMulligansWaitlistSchema } from "../../src/lib/validation";
import type { Env } from "../lib/db";

// Hard cap on total Mini Mulligans early-access signups. Program is a
// small junior curriculum with limited instructor + bay coverage — 18
// gets us roughly two full cohorts of 8 with a buffer for expected
// no-shows / late drop-outs. If we ever change the number, update this
// AND MiniMulligansWaitlistForm's copy in one commit — the frontend
// displays the same cap to signers.
const CAPACITY = 18;

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
  const row = await env.DB.prepare(
    "SELECT COUNT(*) AS c FROM mini_mulligans_waitlist",
  ).first<{ c: number }>();
  const count = row?.c ?? 0;
  return new Response(
    JSON.stringify({
      count,
      capacity: CAPACITY,
      remaining: Math.max(0, CAPACITY - count),
      isFull: count >= CAPACITY,
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
//   2. Capacity — reject with 409 when count >= 18
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
  if (!Number.isFinite(kidAge) || kidAge < 3 || kidAge > 18) {
    return json({ error: "Please enter a valid age." }, 400);
  }

  // Capacity gate. Do the read fresh, don't trust the browser's earlier
  // GET — someone could have submitted between the visitor's page load
  // and their click. If the cap is hit, tell the client with 409 so the
  // form UI can flip to the "full" state.
  const countRow = await env.DB.prepare(
    "SELECT COUNT(*) AS c FROM mini_mulligans_waitlist",
  ).first<{ c: number }>();
  const current = countRow?.c ?? 0;
  if (current >= CAPACITY) {
    return json(
      {
        error: "The Mini Mulligans early-access waitlist is full. Email info@swingtheory.golf to be added to the overflow list.",
        code: "waitlist_full",
      },
      409,
    );
  }

  const ip = request.headers.get("cf-connecting-ip");

  try {
    await env.DB.prepare(
      `INSERT INTO mini_mulligans_waitlist
        (parent_name, email, kid_name, kid_age, phone)
       VALUES (?, ?, ?, ?, ?)`,
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
      // Repeat submission from the same email. Treat as success so the
      // signer sees a friendly state rather than an error — they're
      // already on the list. Re-send the "you're already on it" note so a
      // second signup still produces an email — silence here reads as the
      // form having failed, which is what made them resubmit.
      await sendConfirmation({
        env,
        to: email,
        ...mmWaitlistAlreadyOnList({ kidName: data.kidName }),
      });
      return json({
        ok: true,
        alreadyOnList: true,
      });
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
      subject: `[MM-WAITLIST] ${data.name} · ${data.kidName} (age ${kidAge})`,
      replyTo: data.email,
      html: wrapBrandedEmail({
        title: "New Mini Mulligans waitlist signup",
        intro: `${data.name} signed up for Mini Mulligans early access. They are #${current + 1} of ${CAPACITY} on the list.`,
        bodyHtml: renderKv({
          parent: data.name,
          email: data.email,
          phone: data.phone || "",
          child: data.kidName,
          childAge: String(kidAge),
          position: `${current + 1} / ${CAPACITY}`,
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
      message: `Mini Mulligans waitlist: kid=${data.kidName}, age=${kidAge}, position=${current + 1}/${CAPACITY}`,
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
    capacity: CAPACITY,
  });
};
