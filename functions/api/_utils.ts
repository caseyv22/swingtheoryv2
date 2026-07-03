// Deprecated shim. Contents moved to functions/lib/*
// (http.ts, email.ts, submissions.ts, db.ts, access.ts).
// Kept as a compatibility export; safe to delete once nothing imports it.
export * from "../lib/http";
export * from "../lib/email";
export type { Env } from "../lib/db";
