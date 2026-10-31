import { z } from "zod";

// RangeKey / RangeKey+ checkout (one-time Square charge, then a SwingRes membership with hours).
// Same no-honeypot reasoning as the other checkouts: a bot can't tokenize a real card through
// Square's SDK, and the payment call is the gate.
export const rangeKeyCheckoutSchema = z.object({
  optionSlug: z.enum(["rangekey", "rangekey-plus"]),
  firstName: z.string().trim().min(1, "Please enter your first name").max(60),
  lastName: z.string().trim().min(1, "Please enter your last name").max(60),
  email: z.string().trim().email("Please enter a valid email"),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a valid phone")
    .max(20)
    .optional()
    .or(z.literal("")),
  sourceId: z.string().trim().min(1, "Missing payment details"),
  // Liability waiver, same flow as the /book checkout: read to the end, tick the box. Required.
  // acceptedAt is NOT accepted from the browser, the server stamps it.
  waiver: z.object({
    waiverContentId: z.string().trim().min(1).max(100),
    openedAt: z.string().max(40).nullable().optional(),
    scrollCompletedAt: z.string().max(40).nullable().optional(),
    agreed: z.literal(true),
  }),
});

export type RangeKeyCheckoutInput = z.infer<typeof rangeKeyCheckoutSchema>;
