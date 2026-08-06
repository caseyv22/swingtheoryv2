// Square API helper, membership checkout (customer, card on file, subscription).
// SQUARE_ENV picks the base URL; SQUARE_ACCESS_TOKEN is the only secret.
// Swap SQUARE_ENV to "production" (and the production access token +
// location ID) once the real Green Jacket plans are confirmed working here.

import type { Env } from "./db";

const SQUARE_VERSION = "2026-05-20";

function baseUrl(env: Env): string {
  return env.SQUARE_ENV === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

export class SquareApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type SquareErrorBody = {
  errors?: { code?: string; detail?: string; category?: string }[];
};

async function squareFetch<T>(
  env: Env,
  path: string,
  body?: unknown,
  method: "GET" | "POST" = "POST",
): Promise<T> {
  const res = await fetch(`${baseUrl(env)}${path}`, {
    method,
    headers: {
      "Square-Version": SQUARE_VERSION,
      Authorization: `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: method === "GET" ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T & SquareErrorBody;
  if (!res.ok) {
    const first = data.errors?.[0];
    throw new SquareApiError(
      first?.detail ?? "Square couldn't process that request.",
      res.status,
      first?.code,
    );
  }
  return data as T;
}

type CustomerInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
};

type SquareCustomer = { id: string };

// Look up an existing customer by exact email match before creating a new
// one, keeps retries (and repeat members) from spawning duplicate
// customer records in the Square Directory.
export async function findOrCreateCustomer(env: Env, input: CustomerInput): Promise<string> {
  const search = await squareFetch<{ customers?: SquareCustomer[] }>(
    env,
    "/v2/customers/search",
    {
      query: { filter: { email_address: { exact: input.email } } },
      limit: 1,
    },
  );
  const existing = search.customers?.[0]?.id;
  if (existing) return existing;

  const created = await squareFetch<{ customer: SquareCustomer }>(env, "/v2/customers", {
    idempotency_key: crypto.randomUUID(),
    given_name: input.firstName,
    // Empty string when the caller only has a single "name" field (Mini
    // Mulligans reservation). Send undefined rather than "" so Square keeps
    // the customer record clean and doesn't reject an empty family_name.
    family_name: input.lastName || undefined,
    email_address: input.email,
    phone_number: input.phone || undefined,
  });
  return created.customer.id;
}

export async function createCardOnFile(
  env: Env,
  args: { customerId: string; sourceId: string; cardholderName: string },
): Promise<string> {
  const result = await squareFetch<{ card: { id: string } }>(env, "/v2/cards", {
    idempotency_key: crypto.randomUUID(),
    source_id: args.sourceId,
    card: {
      customer_id: args.customerId,
      cardholder_name: args.cardholderName,
    },
  });
  return result.card.id;
}

export async function createSubscription(
  env: Env,
  args: {
    customerId: string;
    cardId: string;
    planVariationId: string;
    // Parent catalog item id for the plan. Optional — if omitted we
    // chain-fetch it from the subscription plan's `eligible_item_ids[0]`
    // (adds one extra Square call). Passing it explicitly is faster and
    // is what /api/membership-checkout does since memberships.ts already
    // stores the item id per plan.
    itemId?: string;
  },
): Promise<{ id: string; status: string }> {
  // Square requires an explicit `phases[]` array on subscription create AND
  // an `order_template_id` on each RELATIVE-priced phase. The order
  // template is a stored Square Order that Square duplicates each billing
  // cycle — line items on the order = what gets invoiced.
  //
  // Without this Square returns:
  //   400 "Phases with RELATIVE pricing type must have order templates on the phase"
  //
  // Both Green Jacket Solo variations use RELATIVE pricing:
  //   - Regular: 1 monthly RELATIVE phase (pulls $239 from linked item)
  //   - Promo:  phase 0 STATIC $119.50 + phase 1 RELATIVE ongoing
  //
  // Three round trips per checkout:
  //   1. batchGet [planVariation, item] → phases + item variation id
  //   2. POST /v2/orders                → order template
  //   3. POST /v2/subscriptions         → subscription
  //
  // Note: `include_related_objects=true` on plan variations does NOT
  // populate related_objects with the parent plan or eligible items,
  // despite what the Square docs suggest. We batch the two known IDs
  // (variation + item) directly instead.
  // If the caller didn't pass itemId (e.g. program-checkout for a
  // subscription-mode program which doesn't store the item id in D1),
  // chain-fetch the plan → eligible items list → first item. Extra API
  // hop but keeps the helper drop-in for both callers.
  let itemId = args.itemId;
  if (!itemId) {
    const varOnly = await squareFetch<{
      object: { subscription_plan_variation_data?: { subscription_plan_id?: string } };
    }>(env, `/v2/catalog/object/${args.planVariationId}`, undefined, "GET");
    const planId = varOnly.object?.subscription_plan_variation_data?.subscription_plan_id;
    if (!planId) {
      throw new SquareApiError(
        "Plan variation has no parent subscription plan id.",
        500,
      );
    }
    const planOnly = await squareFetch<{
      object: { subscription_plan_data?: { eligible_item_ids?: string[] } };
    }>(env, `/v2/catalog/object/${planId}`, undefined, "GET");
    itemId = planOnly.object?.subscription_plan_data?.eligible_item_ids?.[0];
    if (!itemId) {
      throw new SquareApiError(
        "Subscription plan has no eligible item to bill against.",
        500,
      );
    }
  }

  // ── 1. Fetch plan variation phases + item variation in one batch ──────
  type BatchRes = {
    objects?: Array<{
      type: string;
      id: string;
      subscription_plan_variation_data?: {
        phases?: Array<{ uid: string; ordinal: number; pricing?: { type: string } }>;
      };
      item_data?: {
        variations?: Array<{
          id: string;
          type: string;
          item_variation_data?: { pricing_type?: string };
        }>;
      };
    }>;
  };
  const batchRes = await squareFetch<BatchRes>(env, "/v2/catalog/batch-retrieve", {
    object_ids: [args.planVariationId, itemId],
  });

  const variation = batchRes.objects?.find((o) => o.id === args.planVariationId);
  const item = batchRes.objects?.find((o) => o.id === itemId);
  const planPhases = variation?.subscription_plan_variation_data?.phases ?? [];
  // Prefer a FIXED_PRICING variation — that's what Square bills per cycle.
  // Fall back to first variation if none marked (single-variation items).
  const variations = item?.item_data?.variations ?? [];
  const itemVariation =
    variations.find(
      (v) => v.item_variation_data?.pricing_type === "FIXED_PRICING",
    ) ?? variations[0];
  const itemVariationId = itemVariation?.id;

  if (planPhases.length === 0) {
    throw new SquareApiError("Plan variation has no phases configured.", 500);
  }
  if (!itemVariationId) {
    throw new SquareApiError(
      "Catalog item has no variation to bill against.",
      500,
    );
  }

  // ── 2. Create the order template ──────────────────────────────────────
  // One template per subscription — slightly wasteful (orphan drafts in
  // Square if a checkout fails after this step) but simplest correct
  // behavior. If this becomes noisy, refactor to share a single template
  // across all subscriptions of the same plan.
  const orderRes = await squareFetch<{ order: { id: string } }>(env, "/v2/orders", {
    idempotency_key: crypto.randomUUID(),
    order: {
      // Square subscription order templates must be created in DRAFT
      // state — an OPEN order is treated as a real order and rejected as
      // a template. Error surface without this:
      //   400 "Order template State must be DRAFT, but was OPEN."
      state: "DRAFT",
      location_id: env.SQUARE_LOCATION_ID,
      customer_id: args.customerId,
      line_items: [{ quantity: "1", catalog_object_id: itemVariationId }],
    },
  });
  const orderTemplateId = orderRes.order.id;

  // ── 3. Create the subscription ────────────────────────────────────────
  // Phase shape Square accepts on create:
  //   - `ordinal` — required, maps to the plan variation's phase order
  //   - `order_template_id` — only on RELATIVE phases; STATIC phases
  //     get their price from the plan config itself
  //
  // Do NOT send `plan_phase_uid` on create — Square auto-generates it
  // and errors out ("Phase should not have a plan phase uid at this
  // time; it will be system generated and added later"). We DO fetch
  // the plan phases above to detect RELATIVE vs STATIC by pricing type.
  const phases = planPhases.map((p) => ({
    ordinal: p.ordinal,
    ...(p.pricing?.type === "RELATIVE" ? { order_template_id: orderTemplateId } : {}),
  }));

  const result = await squareFetch<{ subscription: { id: string; status: string } }>(
    env,
    "/v2/subscriptions",
    {
      idempotency_key: crypto.randomUUID(),
      location_id: env.SQUARE_LOCATION_ID,
      plan_variation_id: args.planVariationId,
      customer_id: args.customerId,
      card_id: args.cardId,
      phases,
    },
  );
  return result.subscription;
}

type SquareMoney = { amount: number; currency: string };

// One-time program fees (season sign-ups, camps) use a plain Catalog Item
// Variation rather than a Subscription Plan, price lives on the variation
// in Square, we just look it up fresh at checkout time so a price change
// made in Square shows up immediately without a deploy.
export async function retrieveCatalogItemVariation(
  env: Env,
  catalogObjectId: string,
): Promise<{ name: string; priceMoney: SquareMoney }> {
  const result = await squareFetch<{
    object: {
      type: string;
      item_variation_data?: { name: string; price_money?: SquareMoney };
    };
  }>(env, `/v2/catalog/object/${catalogObjectId}`, undefined, "GET");

  const data = result.object?.item_variation_data;
  if (result.object?.type !== "ITEM_VARIATION" || !data?.price_money) {
    throw new SquareApiError(
      "That Square catalog ID isn't a fixed-price item variation.",
      400,
    );
  }
  return { name: data.name, priceMoney: data.price_money };
}

// Retrieve a catalog ITEM by id. Used by /api/membership-description so
// the checkout Order Summary can show the description Casey edits in
// Square Dashboard instead of a hardcoded copy line. Only the fields we
// actually render are returned so we don't leak the whole item shape to
// the browser.
export async function retrieveCatalogItem(
  env: Env,
  catalogObjectId: string,
): Promise<{
  name: string;
  description: string;
  descriptionHtml?: string;
}> {
  const result = await squareFetch<{
    object: {
      type: string;
      item_data?: {
        name?: string;
        description?: string;
        description_plaintext?: string;
        description_html?: string;
      };
    };
  }>(env, `/v2/catalog/object/${catalogObjectId}`, undefined, "GET");

  const data = result.object?.item_data;
  if (result.object?.type !== "ITEM" || !data) {
    throw new SquareApiError(
      "That Square catalog ID isn't an item.",
      400,
    );
  }
  return {
    name: data.name ?? "",
    // Prefer description_plaintext (Square's stripped version) over the
    // raw description field so the render stays clean when Square adds
    // formatting later.
    description: data.description_plaintext ?? data.description ?? "",
    descriptionHtml: data.description_html,
  };
}

// One-time payments charge the card nonce directly, no card-on-file
// needed since there's nothing to bill again later.
export async function createOneTimePayment(
  env: Env,
  args: { sourceId: string; amountMoney: SquareMoney; buyerEmail: string; note: string },
): Promise<{ id: string; status: string }> {
  const result = await squareFetch<{ payment: { id: string; status: string } }>(
    env,
    "/v2/payments",
    {
      idempotency_key: crypto.randomUUID(),
      source_id: args.sourceId,
      amount_money: args.amountMoney,
      location_id: env.SQUARE_LOCATION_ID,
      buyer_email_address: args.buyerEmail,
      note: args.note,
      autocomplete: true,
    },
  );
  return result.payment;
}
