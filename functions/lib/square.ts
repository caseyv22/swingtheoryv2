// Square API helper — membership checkout (customer, card on file, subscription).
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

async function squareFetch<T>(env: Env, path: string, body: unknown): Promise<T> {
  const res = await fetch(`${baseUrl(env)}${path}`, {
    method: "POST",
    headers: {
      "Square-Version": SQUARE_VERSION,
      Authorization: `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
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
// one — keeps retries (and repeat members) from spawning duplicate
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
