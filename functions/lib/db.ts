// D1 + R2 binding types + tiny helpers.

export type Env = {
  DB: D1Database;
  MEDIA: R2Bucket;
  RESEND_API_KEY: string;
  CONTACT_TO_EMAIL: string;
  CONTACT_FROM_EMAIL: string;
  TURNSTILE_SECRET_KEY?: string;
  MEDIA_PUBLIC_BASE: string;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
  // Square (membership checkout). Access token is a secret
  // (`wrangler pages secret put SQUARE_ACCESS_TOKEN`), never a [vars] entry.
  SQUARE_ACCESS_TOKEN: string;
  SQUARE_LOCATION_ID: string;
  SQUARE_ENV: "sandbox" | "production";
  // Handoff to mm-api after a successful program checkout. Base URL is a
  // [vars] entry (public origin). The shared secret is set via
  // `wrangler pages secret put INTERNAL_PROVISIONING_SECRET` and must
  // match the same-named secret on the mm-api-prod Worker (see
  // POST /internal/enrollments there).
  MM_API_BASE_URL: string;
  INTERNAL_PROVISIONING_SECRET: string;
  // Toggle for the 50%-first-month membership promo. When "true" AND the
  // plan has a squarePromoPlanVariationId in memberships.ts, checkout
  // subscribes against the promo variation instead of the standard one.
  // Public frontend equivalent is VITE_MEMBERSHIP_PROMO_ENABLED so the
  // PlanCard copy stays in sync with what checkout actually charges.
  MEMBERSHIP_PROMO_ENABLED?: string;
  // Shared secret verified by /api/internal/weekly-analytics-email against
  // the X-Internal-Secret request header. Same value is set as a GitHub
  // Actions repo secret and passed by the weekly cron workflow. Rotating
  // it requires updating both places or the cron will start 401ing.
  WEEKLY_ANALYTICS_SECRET: string;
};

// Cloudflare types (minimal subset)
declare global {
  interface D1Database {
    prepare(query: string): D1PreparedStatement;
    batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
    exec(query: string): Promise<D1ExecResult>;
  }
  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first<T = unknown>(colName?: string): Promise<T | null>;
    run(): Promise<D1Result>;
    all<T = unknown>(): Promise<D1Result<T>>;
    raw<T = unknown>(): Promise<T[]>;
  }
  interface D1Result<T = unknown> {
    results?: T[];
    success: boolean;
    meta: { last_row_id: number; changes: number; duration: number };
  }
  interface D1ExecResult {
    count: number;
    duration: number;
  }
  interface R2Bucket {
    get(key: string): Promise<R2ObjectBody | null>;
    put(key: string, value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob, options?: R2PutOptions): Promise<R2Object>;
    delete(key: string | string[]): Promise<void>;
    list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<R2Objects>;
  }
  interface R2Object {
    key: string;
    size: number;
    etag: string;
    httpEtag: string;
    uploaded: Date;
    httpMetadata?: R2HTTPMetadata;
  }
  interface R2ObjectBody extends R2Object {
    body: ReadableStream;
    bodyUsed: boolean;
    arrayBuffer(): Promise<ArrayBuffer>;
    text(): Promise<string>;
  }
  interface R2PutOptions {
    httpMetadata?: R2HTTPMetadata;
    customMetadata?: Record<string, string>;
  }
  interface R2HTTPMetadata {
    contentType?: string;
    contentDisposition?: string;
    cacheControl?: string;
  }
  interface R2Objects {
    objects: R2Object[];
    truncated: boolean;
    cursor?: string;
  }
}

export {};
