// Minimal Cloudflare Pages Functions runtime types.
// If we ever need more, swap this for @cloudflare/workers-types.

declare global {
  type PagesFunction<E = unknown> = (context: {
    request: Request;
    env: E;
    params: Record<string, string>;
    waitUntil: (promise: Promise<unknown>) => void;
    next: (input?: Request) => Promise<Response>;
    data: Record<string, unknown>;
  }) => Response | Promise<Response>;
}

export {};
