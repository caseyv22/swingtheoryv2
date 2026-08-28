import { escapeHtml } from "./http";
import { renderKv, wrapBrandedEmail } from "./email";

// Customer-facing confirmation emails — one builder per submission flow.
//
// Every form on the site used to email staff only; the person who filled it
// out heard nothing back. These builders produce the submitter's copy. They
// return plain { subject, html } and never touch the network — sending is
// the caller's job via sendConfirmation() in ./email, which is best-effort
// and never throws.
//
// House rules for anything added here:
//   - Reuse wrapBrandedEmail so the shell (logo header, NAP footer) stays in
//     exactly one place.
//   - Reuse renderKv for "here's what you sent" recaps. It escapes values
//     and drops honeypot/turnstileToken/empty fields for free.
//   - Any interpolated user value in hand-written HTML MUST go through
//     escapeHtml. renderKv already does this internally.
//   - Set a real preheader. It's the grey line after the subject in most
//     inboxes; leaving it unset makes the title do double duty.

type Built = { subject: string; html: string };

function firstNameOf(fullName: string): string {
  const first = (fullName || "").trim().split(/\s+/)[0];
  return first || "there";
}

// Body paragraph in the same visual language as renderKv's card.
function para(html: string, marginBottom = 14): string {
  return `<p style="font-size:14px;color:#1a1a1a;line-height:1.6;margin:0 0 ${marginBottom}px">${html}</p>`;
}

function sectionHeading(text: string): string {
  return `<div style="font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#064029;margin:26px 0 10px">${escapeHtml(
    text,
  )}</div>`;
}

const HOURS_LINE =
  'If it’s time-sensitive, please call us at <a href="tel:+16268795513" style="color:#064029;font-weight:700;text-decoration:none">626-879-5513</a>. We’re open Monday through Saturday 10am–8pm, and Sunday 10am–7pm.';

// ─── 1. Contact form ────────────────────────────────────────────────────────
export function contactConfirmation(d: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}): Built {
  return {
    subject: `We got your message, ${firstNameOf(d.name)}`,
    html: wrapBrandedEmail({
      title: "Thanks for contacting Swing Theory",
      intro: "Someone from Swing Theory will reply to you soon!",
      preheader: "Someone from Swing Theory will reply to you soon!",
      bodyHtml:
        para("Here’s what you sent us:") +
        renderKv({
          name: d.name,
          email: d.email,
          phone: d.phone || "",
          message: d.message,
        }) +
        `<div style="height:18px"></div>` +
        para(HOURS_LINE, 0),
    }),
  };
}

// ─── 2. Event inquiry ───────────────────────────────────────────────────────
export function eventInquiryConfirmation(d: {
  name: string;
  eventType?: string;
  eventDate?: string;
  groupSize?: string;
  company?: string;
  message: string;
}): Built {
  return {
    subject: "Your event inquiry at Swing Theory",
    html: wrapBrandedEmail({
      title: "Your event inquiry is in.",
      intro: "Our team will follow up with your inquiry soon.",
      preheader: "Our team will follow up soon!",
      bodyHtml:
        para("Here’s what you submitted:") +
        renderKv({
          "event type": d.eventType || "",
          date: d.eventDate || "",
          "group size": d.groupSize || "",
          company: d.company || "",
          message: d.message,
        }) +
        `<div style="height:18px"></div>` +
        para(
          "If any of that changes before we reach you, just reply to this email and we’ll update it.",
          0,
        ),
    }),
  };
}

// ─── 3. Interest form (membership plans and programs) ───────────────────────
export function interestConfirmation(d: {
  program: string;
  message?: string;
}): Built {
  return {
    subject: `Thanks for asking about ${d.program}`,
    html: wrapBrandedEmail({
      title: `We got your question about ${d.program}.`,
      intro: "A team member will follow up with details and next steps shortly.",
      preheader: "A team member will follow up with details and next steps.",
      bodyHtml:
        para("Here’s what you sent:") +
        renderKv({ program: d.program, message: d.message || "" }),
    }),
  };
}

// ─── 4. League signup ───────────────────────────────────────────────────────
export function leagueConfirmation(d: {
  handicap?: string;
  teamPreference?: string;
  message?: string;
}): Built {
  return {
    subject: "You’re on the list for league night",
    html: wrapBrandedEmail({
      title: "You’re on the league list.",
      intro:
        "We’ll email you league details (schedule, format, and team placement) before the next season kicks off.",
      preheader: "We’ll email league details before the next season kicks off.",
      bodyHtml:
        para("Here’s what we have for you:") +
        renderKv({
          handicap: d.handicap || "",
          "team preference": d.teamPreference || "",
          message: d.message || "",
        }),
    }),
  };
}

// ─── 5. Mini Mulligans registration ─────────────────────────────────────────
// Every logistic a parent needs for launch day lives here — date, schedule,
// arrive-early, the free-first / opt-in pricing, and the reply-to-cancel
// ask. Keep these details in sync with the on-page form
// (MiniMulligansWaitlistForm.tsx). Sign-up no longer collects a card
// (that was suppressing signups), so this leads with "a team member will
// reach out to confirm" rather than any payment/card language.
export function mmWaitlistConfirmation(d: {
  name: string;
  kidName: string;
  kidAge: number;
}): Built {
  return {
    subject: `${d.kidName} is registered for Mini Mulligans. Launch day is Tuesday, Sept 8`,
    html: wrapBrandedEmail({
      title: `${escapeHtml(d.kidName)} is registered for Mini Mulligans.`,
      intro:
        "You’re all set for launch day. Here’s everything you need for Tuesday, September 8. Your first session is on us.",
      preheader: "Launch day is Tuesday, September 8. Your first session is free.",
      bodyHtml:
        sectionHeading("We’ll be in touch") +
        para(
          "A Swing Theory team member will reach out soon to confirm your spot and answer any questions before launch day. No payment is due today.",
        ) +
        sectionHeading("Launch day") +
        para(
          "<strong>Tuesday, September 8.</strong> Your first session is complimentary. Come see if Mini Mulligans is the right fit for your golfer, no cost and no commitment.",
        ) +
        sectionHeading("Schedule") +
        para(
          "Sessions run <strong>Tuesdays and Thursdays, 4:30–6:00 PM.</strong>",
        ) +
        sectionHeading("Before you arrive") +
        para(
          "Please show up <strong>10–15 minutes early</strong> for check-in and team assignment.",
        ) +
        sectionHeading("Pricing") +
        para(
          "Mini Mulligans is <strong>$400/month</strong>. Nothing is charged until you decide to continue after your complimentary launch-day session, and we’ll confirm with you before anything is charged.",
        ) +
        sectionHeading("Can’t make it?") +
        para(
          "Please reply to this email at least a day before so we can offer your spot to another family on our list.",
          0,
        ) +
        `<div style="height:22px"></div>` +
        para("<strong>We can’t wait to see you.</strong>") +
        renderKv({
          "child’s name": d.kidName,
          age: String(d.kidAge),
          parent: d.name,
        }),
    }),
  };
}

// Repeat submission from an address already registered. The endpoint
// returns 200 { alreadyOnList: true } rather than an error, so the sender
// sees a friendly state — this is the matching email.
export function mmWaitlistAlreadyOnList(d: { kidName: string }): Built {
  return {
    subject: `${d.kidName} is already registered for Mini Mulligans`,
    html: wrapBrandedEmail({
      title: `${escapeHtml(d.kidName)} is already registered.`,
      intro:
        "You’re confirmed for launch day. No need to sign up again.",
      preheader: "Launch day is Tuesday, September 8. Your first session is free.",
      bodyHtml:
        para(
          "Mini Mulligans launches <strong>Tuesday, September 8</strong>. Sessions run Tuesdays and Thursdays, 4:30–6:00 PM, and your first session is complimentary. Please show up 10–15 minutes early for check-in and team assignment.",
        ) +
        para(
          "Need to change your child’s details, or can’t make it? Just reply to this email.",
        ) +
        para("<strong>We can’t wait to see you.</strong>", 0),
    }),
  };
}

// ─── 6. Membership checkout (Solo + Group) ──────────────────────────────────
// Perks come from the plan row in src/data/memberships.ts rather than being
// retyped here, so the email and the pricing card can never drift apart.
// The Group variant differs only by those perks plus the second-member
// block below.
export function membershipConfirmation(d: {
  firstName: string;
  planName: string;
  priceLabel: string;
  perks: string[];
  isGroup: boolean;
}): Built {
  const perkRows = d.perks
    .map(
      (p) =>
        `<tr><td style="padding:3px 0"><span style="color:#c8a24a;font-weight:700">✓</span>&nbsp; ${escapeHtml(
          p,
        )}</td></tr>`,
    )
    .join("");

  // Renewal day in Pacific. Workers run in UTC, so a naive getDate() would
  // report tomorrow for anyone signing up after 5pm PT.
  const pacificDay = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      day: "numeric",
    }).format(new Date()),
  );
  const ordinal = (n: number): string => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const secondMemberBlock = d.isGroup
    ? sectionHeading("Adding your second member") +
      `<div style="background:#fdfaf1;border:1px solid #ecdcb4;border-radius:12px;padding:16px 20px">` +
      para(
        "Your plan covers two people. Reply to this email with your second member’s name and email and we’ll get them set up.",
        0,
      ) +
      `</div>`
    : "";

  return {
    subject: `Welcome to the Green Jacket, ${d.firstName}`,
    html: wrapBrandedEmail({
      title: "Welcome to the Green Jacket.",
      // No intro on purpose — the title carries it. An "almost ready"
      // style line here reads as "your payment didn't go through", which
      // is the exact anxiety this email exists to remove.
      preheader: "Thanks for joining Swing Theory’s Membership!",
      bodyHtml:
        sectionHeading("Your membership") +
        renderKv({
          plan: d.planName,
          price: d.priceLabel,
          renews: `on the ${ordinal(pacificDay)} of each month`,
        }) +
        sectionHeading("What’s included") +
        `<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#1a1a1a;line-height:1.6">${perkRows}</table>` +
        secondMemberBlock +
        sectionHeading("Booking your bay") +
        para(
          "You will receive a separate email to setup your online account as well as your membership contract. After, you will be able to book your time in our bays.",
        ) +
        para(
          "Your card is on file and bills monthly. Square will send a separate payment receipt for your records.",
        ) +
        para("Questions about your membership? Reply to this email.", 0),
    }),
  };
}
