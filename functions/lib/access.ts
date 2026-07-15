// Cloudflare Access JWT verification.
// Access injects the JWT in either `Cf-Access-Jwt-Assertion` header or
// `CF_Authorization` cookie. We verify signature against the team's JWKS,
// check audience (AUD) claim, and return the caller's email.

import type { Env } from "./db";

type JWTHeader = { kid: string; alg: string };
type AccessPayload = {
  aud: string | string[];
  email?: string;
  sub: string;
  iat: number;
  exp: number;
  iss: string;
};

let jwksCache: { url: string; keys: JsonWebKey[]; fetchedAt: number } | null = null;

async function loadJwks(teamDomain: string): Promise<JsonWebKey[]> {
  const url = `https://${teamDomain}/cdn-cgi/access/certs`;
  const fresh = Date.now() - (jwksCache?.fetchedAt ?? 0) < 60 * 60 * 1000;
  if (jwksCache?.url === url && fresh) return jwksCache.keys;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch JWKS: ${res.status}`);
  const data = (await res.json()) as { keys: JsonWebKey[] };
  jwksCache = { url, keys: data.keys, fetchedAt: Date.now() };
  return data.keys;
}

function b64urlDecode(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

export type AccessUser = { email: string; sub: string };

export async function verifyAccessJwt(
  request: Request,
  env: Env,
): Promise<AccessUser | null> {
  // FAIL CLOSED. Older builds of this file returned a fake admin user
  // when ACCESS_TEAM_DOMAIN / ACCESS_AUD were unset — a dev convenience
  // that shipped to production and left /admin publicly accessible.
  // Now: if the env vars aren't set, no admin request can succeed.
  // Configure both in Cloudflare Pages env vars AND set up a Cloudflare
  // Access application that protects /admin/* at the edge (the edge
  // gate is what actually prevents the SPA from rendering for anons;
  // this check is defense-in-depth for the API).
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) {
    console.error("Cloudflare Access env vars missing — refusing admin request.");
    return null;
  }

  const header = request.headers.get("cf-access-jwt-assertion");
  const cookie = request.headers.get("cookie") ?? "";
  const cookieToken = /(?:^|;\s*)CF_Authorization=([^;]+)/.exec(cookie)?.[1];
  const token = header ?? cookieToken;
  if (!token) return null;

  const [headerB64, payloadB64, sigB64] = token.split(".");
  if (!headerB64 || !payloadB64 || !sigB64) return null;

  const header0 = JSON.parse(bytesToString(b64urlDecode(headerB64))) as JWTHeader;
  const payload = JSON.parse(bytesToString(b64urlDecode(payloadB64))) as AccessPayload;

  // Audience check
  const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!auds.includes(env.ACCESS_AUD)) return null;

  // Expiration check
  if (payload.exp * 1000 < Date.now()) return null;

  // Signature verification
  const keys = await loadJwks(env.ACCESS_TEAM_DOMAIN);
  const jwk = keys.find((k) => (k as unknown as { kid: string }).kid === header0.kid);
  if (!jwk) return null;

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const signature = b64urlDecode(sigB64).slice().buffer;
  const signed = new TextEncoder().encode(`${headerB64}.${payloadB64}`).slice().buffer;
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, signed);
  if (!ok) return null;

  return { email: payload.email ?? "", sub: payload.sub };
}

/** Convenience: 401 if no valid Access JWT. */
export async function requireAdmin(request: Request, env: Env): Promise<AccessUser | Response> {
  const user = await verifyAccessJwt(request, env);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}
