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
  const result = await squareFetch<{ subscription: { id: string; status: string } }>(
    env,
    "/v2/subscriptions",
    {
      idempotency_key: crypto.randomUUID(),
      location_id: env.SQUARE_LOCATION_ID,
      plan_variation_id: args.planVariationId,
      customer_id: args.customerId,
      card_id: args.cardId,
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
