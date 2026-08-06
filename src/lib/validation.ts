import { z } from "zod";

// Shared field schemas
const name = z.string().trim().min(2, "Please enter your name").max(80);
const email = z.string().trim().email("Please enter a valid email");
const phone = z
  .string()
  .trim()
  .min(7, "Please enter a valid phone")
  .max(20)
  .optional()
  .or(z.literal(""));
const message = z.string().trim().min(5, "Add a short message").max(2000);

// Honeypot, must be empty. Real users don't see it; bots fill it in.
const honeypot = z.string().max(0, "Bot detected").optional().or(z.literal(""));

export const contactSchema = z.object({
  name,
  email,
  phone,
  message,
  honeypot,
  turnstileToken: z.string().optional(),
});

export const eventsInquirySchema = z.object({
  name,
  email,
  phone,
  company: z.string().trim().max(120).optional().or(z.literal("")),
  groupSize: z.string().trim().max(20).optional().or(z.literal("")),
  eventDate: z.string().trim().max(40).optional().or(z.literal("")),
  eventType: z.string().trim().max(80).optional().or(z.literal("")),
  message,
  honeypot,
  turnstileToken: z.string().optional(),
});

export const leagueSignupSchema = z.object({
  name,
  email,
  phone,
  handicap: z.string().trim().max(20).optional().or(z.literal("")),
  teamPreference: z
    .enum(["Solo (place me on a team)", "I have a team", "Not sure yet"])
    .optional(),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  honeypot,
  turnstileToken: z.string().optional(),
});

// One shared "interest" form used for membership plans and programs alike.
// `program` doubles as the general "topic" field, kept as `program` (not
// renamed to `topic`) because the D1 submissions table column and admin UI
// already key off that name.
export const interestSchema = z.object({
  name,
  email,
  phone,
  program: z.string().trim().min(2).max(80),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  honeypot,
  turnstileToken: z.string().optional(),
});

// Membership checkout, paid signup via Square. No honeypot/turnstile here:
// a bot can't tokenize a real card through Square's SDK, and the payment
// call itself is the anti-abuse gate.
export const membershipCheckoutSchema = z.object({
  planSlug: z.string().trim().min(1).max(60),
  firstName: z.string().trim().min(1, "Please enter your first name").max(60),
  lastName: z.string().trim().min(1, "Please enter your last name").max(60),
  email,
  phone,
  sourceId: z.string().trim().min(1, "Missing payment details"),
});

// One-time program checkout (season fees, camps). Same no-honeypot
// reasoning as membershipCheckoutSchema, the payment call is the gate.
//
// childFirstName / childAge are optional at the schema level so students'
// programs (Women's Clinic, Senior Clinic, etc.) don't have to send them.
// The API layer enforces presence for parent-role programs like Mini
// Mulligans where the enrollment is for the child, not the payer.
export const programCheckoutSchema = z.object({
  programSlug: z.string().trim().min(1).max(60),
  firstName: z.string().trim().min(1, "Please enter your first name").max(60),
  lastName: z.string().trim().min(1, "Please enter your last name").max(60),
  email,
  phone,
  sourceId: z.string().trim().min(1, "Missing payment details"),
  childFirstName: z.string().trim().max(60).optional().or(z.literal("")),
  // Kept as a string here because the form's FormData gives us strings.
  // The API layer parses it to an int before handing it off to mm-api.
  childAge: z.string().trim().max(3).optional().or(z.literal("")),
});

// Mini Mulligans early-access waitlist. Separate schema from the general
// interest form because the fields are program-specific (kid name + age)
// and the backend enforces a hard 18-signup cap on this endpoint. No
// Turnstile: form is throttled by the cap itself and by the UNIQUE(email)
// constraint at the DB, and losing a slot to a bot signup is a bigger
// problem than an occasional stale Turnstile token.
export const miniMulligansWaitlistSchema = z.object({
  name,
  email,
  kidName: z.string().trim().min(1, "Please enter your child's name").max(60),
  // Kept as string because FormData gives us strings; the API layer
  // coerces to int after validation.
  kidAge: z
    .string()
    .trim()
    .min(1, "Please enter your child's age")
    .max(3)
    .regex(/^\d+$/, "Age must be a number"),
  phone,
  // Square Web Payments card nonce. Required: reservations now put a card
  // on file at signup ($0 charged) so the $400/mo can be activated later
  // without the parent re-entering payment. Tokenized in-browser, so the
  // client omits it from its own parse and appends it after tokenize().
  sourceId: z.string().trim().min(1, "Card details are required"),
  honeypot,
});

export type ContactInput = z.infer<typeof contactSchema>;
export type EventsInquiryInput = z.infer<typeof eventsInquirySchema>;
export type LeagueSignupInput = z.infer<typeof leagueSignupSchema>;
export type InterestInput = z.infer<typeof interestSchema>;
export type MembershipCheckoutInput = z.infer<typeof membershipCheckoutSchema>;
export type ProgramCheckoutInput = z.infer<typeof programCheckoutSchema>;
export type MiniMulligansWaitlistInput = z.infer<typeof miniMulligansWaitlistSchema>;
