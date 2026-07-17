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
    family_name: input.lastName,
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
  args: { customerId: string; cardId: string; planVariationId: string },
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
  // We do it in three round trips per checkout:
  //   1. GET plan variation with related_objects → get phases + plan + item
  //   2. POST /v2/orders                        → create the order template
  //   3. POST /v2/subscriptions                 → with phases + template id
  //
  // STATIC phases (like the promo's phase 0) don't need an order template,
  // so we conditionally attach it based on pricing.type.

  // ── 1. Fetch plan variation + related objects (plan + item) ────────────
  type CatalogRes = {
    object: {
      subscription_plan_variation_data?: {
        subscription_plan_id?: string;
        phases?: Array<{ uid: string; ordinal: number; pricing?: { type: string } }>;
      };
    };
    related_objects?: Array<{
      type: string;
      id: string;
      subscription_plan_data?: { eligible_item_ids?: string[] };
      item_data?: { variations?: Array<{ id: string; type: string }> };
    }>;
  };
  const varRes = await squareFetch<CatalogRes>(
    env,
    `/v2/catalog/object/${args.planVariationId}?include_related_objects=true`,
    undefined,
    "GET",
  );

  const varData = varRes.object?.subscription_plan_variation_data;
  const planPhases = varData?.phases ?? [];
  const planId = varData?.subscription_plan_id ?? "";
  const relatedPlan = varRes.related_objects?.find(
    (o) => o.type === "SUBSCRIPTION_PLAN" && o.id === planId,
  );
  const eligibleItemId =
    relatedPlan?.subscription_plan_data?.eligible_item_ids?.[0] ?? "";
  const relatedItem = varRes.related_objects?.find(
    (o) => o.type === "ITEM" && o.id === eligibleItemId,
  );
  const itemVariationId = relatedItem?.item_data?.variations?.find(
    (v) => v.type === "ITEM_VARIATION",
  )?.id;

  if (!itemVariationId) {
    throw new SquareApiError(
      "Could not resolve item variation for this subscription plan.",
      500,
    );
  }

  // ── 2. Create the order template ──────────────────────────────────────
  // Line items reference the item variation directly (Square pulls the
  // FIXED_PRICING price from the variation record). One template per
  // subscription — slightly wasteful but simplest correct behavior. If
  // this becomes a lot of orphan draft orders in Square, refactor to
  // share a single template across all subscriptions of the same plan.
  const orderRes = await squareFetch<{ order: { id: string } }>(
    env,
    "/v2/orders",
    {
      idempotency_key: crypto.randomUUID(),
      order: {
        location_id: env.SQUARE_LOCATION_ID,
        customer_id: args.customerId,
        line_items: [
          {
            quantity: "1",
            catalog_object_id: itemVariationId,
          },
        ],
      },
    },
  );
  const orderTemplateId = orderRes.order.id;

  // ── 3. Create the subscription ────────────────────────────────────────
  const phases = planPhases.map((p) => ({
    ordinal: p.ordinal,
    plan_phase_uid: p.uid,
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
