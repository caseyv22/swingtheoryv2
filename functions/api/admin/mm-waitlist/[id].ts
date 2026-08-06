import { json } from "../../../lib/http";
import { requireAdmin } from "../../../lib/access";
import { sendEmail, renderKv, wrapBrandedEmail } from "../../../lib/email";
import { createSubscription, SquareApiError } from "../../../lib/square";
import { provisionInMmApi } from "../../../lib/mm-provisioning";
import type { Env } from "../../../lib/db";

// Mini Mulligans monthly price in cents. The subscription bills this off
// the linked Square catalog item; we pass it to mm-api only so the Sync
// enrollment record shows what the parent is paying. Keep in sync with the
// Square "Mini Mulligans" item price ($400).
const MM_PRICE_CENTS = 40000;

// DELETE /api/admin/mm-waitlist/:id
// Removes a waitlist entry entirely. Frees up their slot in the 18-cap so
// the next signup succeeds. No soft delete — no reason to keep a
// deactivated row around on such a small dataset, and hard delete keeps
// the position numbers meaningful.
export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;

  const id = Number.parseInt(String(params.id ?? ""), 10);
  if (!Number.isFinite(id)) return json({ error: "Invalid id" }, 400);

  const res = await env.DB.prepare(
    `DELETE FROM mini_mulligans_waitlist WHERE id = ?`,
  )
    .bind(id)
    .run();

  if (res.meta.changes === 0) return json({ error: "Not found" }, 404);
  return json({ ok: true });
};

// POST /api/admin/mm-waitlist/:id
// Activate a reserved parent: create the $400/mo Square subscription from
// the card they put on file at signup. This is the FIRST charge and the
// moment the Sync enrollment is created. Opt-in by design — nothing here
// runs until an admin clicks "Activate" after the free launch session.
//
// Idempotent-ish: if the row is already activated, we return its existing
// subscription id rather than double-billing. Rows with no card on file
// (legacy pre-card signups, or admin manual-adds) can't be activated here;
// the admin collects payment another way.
type ReservationRow = {
  id: number;
  parent_name: string;
  email: string;
  kid_name: string;
  kid_age: number;
  phone: string | null;
  square_customer_id: string | null;
  square_card_id: string | null;
  status: string;
  subscription_id: string | null;
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;

  const id = Number.parseInt(String(params.id ?? ""), 10);
  if (!Number.isFinite(id)) return json({ error: "Invalid id" }, 400);

  const row = await env.DB.prepare(
    `SELECT id, parent_name, email, kid_name, kid_age, phone,
            square_customer_id, square_card_id, status, subscription_id
       FROM mini_mulligans_waitlist WHERE id = ?`,
  )
    .bind(id)
    .first<ReservationRow>();

  if (!row) return json({ error: "Not found" }, 404);
  if (row.status === "activated") {
    return json({ ok: true, alreadyActivated: true, subscriptionId: row.subscription_id });
  }
  if (!row.square_customer_id || !row.square_card_id) {
    return json(
      {
        error:
          "This reservation has no card on file (signed up before card capture, or added manually). Collect payment in Square directly.",
      },
      400,
    );
  }
  if (!env.MM_SUBSCRIPTION_PLAN_VARIATION_ID) {
    return json({ error: "Mini Mulligans plan variation id is not configured." }, 500);
  }

  let subscriptionId: string;
  let subscriptionStatus: string;
  try {
    const sub = await createSubscription(env, {
      customerId: row.square_customer_id,
      cardId: row.square_card_id,
      planVariationId: env.MM_SUBSCRIPTION_PLAN_VARIATION_ID,
    });
    subscriptionId = sub.id;
    subscriptionStatus = sub.status;
  } catch (e) {
    if (e instanceof SquareApiError) {
      return json({ error: e.message }, e.status >= 500 ? 502 : e.status);
    }
    console.error(
      `[mm-activate] subscription create failed for id=${id}: ${String((e as Error)?.message || e)}`,
    );
    return json({ error: "Couldn't create the subscription. Please try again." }, 500);
  }

  // Subscription (and first charge) succeeded. Commit the row before the
  // best-effort side effects so a Sync/email hiccup can't lose the fact
  // that this parent is now billed.
  await env.DB.prepare(
    `UPDATE mini_mulligans_waitlist
        SET status = 'activated',
            subscription_id = ?,
            activated_at = datetime('now')
      WHERE id = ?`,
  )
    .bind(subscriptionId, id)
    .run();

  // Provision the Sync enrollment now that there's a real payment behind
  // it. Best-effort: the card is already billed, so a Sync failure must not
  // fail activation. Staff email surfaces the outcome so an admin can add
  // the member by hand if needed.
  const mmResult = await provisionInMmApi(env, {
    source: "swingtheoryv2-mm-activate",
    programSlug: "mini-mulligans",
    programName: "Mini Mulligans",
    paymentRef: subscriptionId,
    paymentAmountCents: MM_PRICE_CENTS,
    fullName: row.parent_name,
    email: row.email,
    phone: row.phone || "",
    childFirstName: row.kid_name.trim().split(/\s+/)[0] || row.kid_name,
    childAge: Number.isFinite(row.kid_age) ? row.kid_age : null,
  });

  try {
    await sendEmail({
      env,
      subject: `[MM-ACTIVATED] ${row.parent_name} · ${row.kid_name}`,
      replyTo: row.email,
      html: wrapBrandedEmail({
        title: "Mini Mulligans activated",
        intro: `${row.parent_name} was activated on the $400/mo Mini Mulligans plan.`,
        bodyHtml: renderKv({
          parent: row.parent_name,
          email: row.email,
          child: row.kid_name,
          subscriptionId,
          subscriptionStatus,
          sync: mmResult.ok
            ? `OK (${mmResult.action}, enrollment ${mmResult.enrollmentId})`
            : `FAILED: ${mmResult.error} (add member manually in Sync)`,
        }),
      }),
    });
  } catch {
    // swallow, staff email is best-effort
  }

  return json({
    ok: true,
    subscriptionId,
    status: subscriptionStatus,
    sync: mmResult.ok ? mmResult.action : `failed: ${mmResult.error}`,
  });
};
