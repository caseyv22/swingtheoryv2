// Client-side click tracking. Fires POST /api/e with sendBeacon so the
// request survives the browser navigating away (which is what happens
// immediately after a "Book a Bay" click or a coach phone tap on mobile).
//
// Session and visitor IDs are the SAME values the pageview beacon uses —
// keys are 'st_sid' (sessionStorage) and 'st_vid' (localStorage) as set in
// src/components/Layout.tsx. This means click events can be joined to
// pageviews on session_id/visitor_id for funnel analysis later.
//
// Silent on failure. Analytics loss shouldn't ever affect UX.

export function trackClick(label: string, target?: string): void {
  if (typeof window === "undefined") return;
  let sid = "";
  let vid = "";
  try {
    sid = sessionStorage.getItem("st_sid") || "";
    if (!sid) {
      sid = crypto.randomUUID().replace(/-/g, "");
      sessionStorage.setItem("st_sid", sid);
    }
    vid = localStorage.getItem("st_vid") || "";
    if (!vid) {
      vid = crypto.randomUUID().replace(/-/g, "");
      localStorage.setItem("st_vid", vid);
    }
  } catch {
    return;
  }

  const payload = JSON.stringify({
    event_name: "click",
    label,
    target: target ?? "",
    path: window.location.pathname,
    session_id: sid,
    visitor_id: vid,
  });

  // Prefer sendBeacon — the browser guarantees delivery even if the
  // click triggers immediate navigation. Falls back to fetch(keepalive)
  // for browsers that don't support the Blob variant of sendBeacon.
  try {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.sendBeacon === "function"
    ) {
      const blob = new Blob([payload], { type: "application/json" });
      const ok = navigator.sendBeacon("/api/e", blob);
      if (ok) return;
    }
  } catch {
    // fall through to fetch
  }

  fetch("/api/e", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}
