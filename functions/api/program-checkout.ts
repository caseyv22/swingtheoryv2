import { json, readJson } from "../lib/http";
import { sendEmail, renderKv, wrapBrandedEmail } from "../lib/email";
import { logSubmission } from "../lib/submissions";
import { programCheckoutSchema } from "../../src/lib/validation";
import { retrieveCatalogItemVariation, createOneTimePayment, SquareApiError } from "../lib/square";
import type { Env } from "../lib/db";

type ProgramCheckoutRow = {
  id: number;
  name: string;
  checkout_mode: string;
  square_catalog_id: string;
};

// One-time program fees (season sign-ups, camps). The Web Payments SDK on
// /programs/checkout tokenizes the card in-browser and posts us the nonce
// (sourceId) — we charge it directly via the Payments API, no card-on-file
// needed since there's nothing to bill again later.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readJson(request);
  const parsed = programCheckoutSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Please check your entries and try again." }, 400);
  const data = parsed.data;

  // Server-side lookup — never trust a client-supplied catalog id or price.
  // Only published programs explicitly wired for one_time checkout qualify.
  const program = await env.DB.prepare(
    `SELECT id, name, checkout_mode, square_catalog_id FROM programs
     WHERE slug = ? AND published = 1`,
  )
    .bind(data.programSlug)
    .first<ProgramCheckoutRow>();

  if (!program || program.checkout_mode !== "one_time" || !program.square_catalog_id) {
    return json({ error: "That program isn't available for checkout yet." }, 400);
  }

  const ip = request.headers.get("cf-connecting-ip");

  try {
    // Price always comes fresh from Square, not from our own DB or the
    // client — a price change in Square shows up immediately, no deploy.
    const item = await retrieveCatalogItemVariation(env, program.square_catalog_id);

    const payment = await createOneTimePayment(env, {
      sourceId: data.sourceId,
      amountMoney: item.priceMoney,
      buyerEmail: data.email,
      note: `${program.name} — ${item.name}`,
    });

    // Staff notification — best-effort. The payment already succeeded by
    // this point, so an email hiccup shouldn't fail the checkout.
    try {
      await sendEmail({
        env,
        subject: `[PROGRAM] New signup: ${data.firstName} ${data.lastName} · ${program.name}`,
        replyTo: data.email,
        html: wrapBrandedEmail({
          title: "New program signup",
          intro: `${data.firstName} ${data.lastName} just paid for ${program.name} through the website checkout.`,
          bodyHtml: renderKv({
            name: `${data.firstName} ${data.lastName}`,
            email: data.email,
            phone: data.phone || "",
            program: program.name,
            amount: `$${(item.priceMoney.amount / 100).toFixed(2)} ${item.priceMoney.currency}`,
            paymentId: payment.id,
            paymentStatus: payment.status,
          }),
        }),
      });
    } catch {
      // swallow — see comment above
    }

    await logSubmission({
      env,
      formType: "program-checkout",
      data: {
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        phone: data.phone || "",
        message: `${program.name} — payment ${payment.id} (${payment.status})`,
        paymentId: payment.id,
      },
      program: program.name,
      ip,
      userAgent: request.headers.get("user-agent"),
    });

    return json({ ok: true, paymentId: payment.id, status: payment.status });
  } catch (e) {
    if (e instanceof SquareApiError) {
      return json({ error: e.message }, e.status >= 500 ? 502 : e.status);
    }
    return json(
      { error: "Something went wrong processing your payment. Please try again." },
      500,
    );
  }
};
