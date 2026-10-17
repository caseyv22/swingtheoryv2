import type { Env } from "./db";

// D1 record of each signed-agreement membership signup (see migrations/0010). Every write here is
// best-effort EXCEPT createSignup: that one is awaited before the card is touched, and if it
// throws the checkout stops, because charging someone with no record of their signature is the
// one outcome this flow must never produce.

export type SignupStatus =
  | "signed"
  | "payment_failed"
  | "paid"
  | "provisioned"
  | "provision_failed";

export async function createSignup(
  env: Env,
  s: {
    id: string;
    planSlug: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    agreementContentId: string;
    typedSignature: string;
    openedAt: string | null;
    scrollCompletedAt: string | null;
    signedAt: string;
    ipAddress: string | null;
    userAgent: string | null;
    monthlyFee: string;
    firstMonthTerms: string;
  },
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO membership_signups
       (id, plan_slug, first_name, last_name, email, phone, agreement_content_id, typed_signature,
        opened_at, scroll_completed_at, signed_at, ip_address, user_agent, monthly_fee, first_month_terms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      s.id,
      s.planSlug,
      s.firstName,
      s.lastName,
      s.email,
      s.phone,
      s.agreementContentId,
      s.typedSignature,
      s.openedAt,
      s.scrollCompletedAt,
      s.signedAt,
      s.ipAddress,
      s.userAgent,
      s.monthlyFee,
      s.firstMonthTerms,
    )
    .run();
}

/** Best-effort status update: a DB blip here must not fail a checkout that already charged. */
export async function updateSignup(
  env: Env,
  id: string,
  fields: {
    status: SignupStatus;
    squareSubscriptionId?: string;
    squareSubscriptionStatus?: string;
    swingresCustomerId?: string;
    swingresSubscriptionId?: string;
    swingresAgreementId?: string;
    errorMessage?: string | null;
  },
): Promise<void> {
  try {
    await env.DB.prepare(
      `UPDATE membership_signups SET
         status = ?,
         square_subscription_id = COALESCE(?, square_subscription_id),
         square_subscription_status = COALESCE(?, square_subscription_status),
         swingres_customer_id = COALESCE(?, swingres_customer_id),
         swingres_subscription_id = COALESCE(?, swingres_subscription_id),
         swingres_agreement_id = COALESCE(?, swingres_agreement_id),
         error_message = ?,
         updated_at = datetime('now')
       WHERE id = ?`,
    )
      .bind(
        fields.status,
        fields.squareSubscriptionId ?? null,
        fields.squareSubscriptionStatus ?? null,
        fields.swingresCustomerId ?? null,
        fields.swingresSubscriptionId ?? null,
        fields.swingresAgreementId ?? null,
        fields.errorMessage ?? null,
        id,
      )
      .run();
  } catch (e) {
    console.error(`[membership-signups] update failed for ${id}: ${e instanceof Error ? e.message : String(e)}`);
  }
}
