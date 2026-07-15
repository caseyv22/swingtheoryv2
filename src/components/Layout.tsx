import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Nav from "./Nav";
import Footer from "./Footer";
import JsonLd from "./JsonLd";
import { localBusinessSchema, organizationSchema, websiteSchema } from "@/schema";

// Global reveal-on-scroll hook (matches mockup).
//
// Two bugs fixed here:
// 1. This effect originally had no dependency array, so it tore down and
//    rebuilt the IntersectionObserver on every render, not just on
//    navigation. That churn could race with the observer's first
//    callback and leave ".reveal" sections stuck at opacity:0
//    indefinitely, looking like the section "never loaded" until a hard
//    refresh happened to land cleanly. Fixed by keying the effect to the
//    route pathname (rebuild once per page, not once per render).
// 2. Content that mounts AFTER that initial per-route scan, e.g. the
//    Lessons "Meet the team" grid, which renders a fallback card
//    immediately then swaps in real coaches once /api/public/coaches
//    responds, was never observed at all, since the DOM was only
//    scanned once on mount. Those elements had nothing that would ever
//    add the ".in" class, so they stayed invisible forever ("not
//    loading") no matter how long you waited or how many times you
//    refreshed. Fixed with a MutationObserver that keeps watching for
//    newly-added ".reveal" elements for the life of the page and wires
//    them into the same IntersectionObserver as they appear.
function useRevealOnScroll() {
  const { pathname } = useLocation();

  useEffect(() => {
    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              entries.forEach((e) => {
                if (e.isIntersecting) {
                  e.target.classList.add("in");
                  io!.unobserve(e.target);
                }
              });
            },
            { threshold: 0.12 },
          )
        : null;

    const observe = (el: Element) => {
      if (!(el instanceof HTMLElement) || el.classList.contains("in")) return;
      if (io) io.observe(el);
      else el.classList.add("in"); // no IntersectionObserver support: just show it
    };

    document.querySelectorAll(".reveal").forEach(observe);

    // Keep watching for reveal elements added later (async data, etc.).
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(".reveal")) observe(node);
          node.querySelectorAll?.(".reveal").forEach(observe);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Safety net: never let a section stay invisible forever, even if IO
    // is unsupported or something upstream stalls.
    const fallback = window.setTimeout(() => {
      document
        .querySelectorAll<HTMLElement>(".reveal:not(.in)")
        .forEach((el) => el.classList.add("in"));
    }, 1500);

    return () => {
      window.clearTimeout(fallback);
      mo.disconnect();
      io?.disconnect();
    };
  }, [pathname]);
}

// First-party analytics beacon. Fires POST /api/pv on every SPA route
// change (including the initial page load). Silent — never surfaces
// errors or console noise to visitors. Session ID lives in
// sessionStorage (cleared when the tab closes), visitor ID lives in
// localStorage (persistent across sessions, cleared with cookies).
//
// Debounced against back-to-back same-path fires (StrictMode double-renders,
// same-path scroll changes, etc.) so we don't inflate pageview counts.
function usePageviewBeacon() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (typeof window === "undefined") return;
    // sessionStorage may throw in private browsing on some Safari builds —
    // any exception means we skip the beacon this session. Not worth
    // dying over.
    let sessionId: string, visitorId: string;
    try {
      sessionId = sessionStorage.getItem("st_sid") || "";
      if (!sessionId) {
        sessionId = crypto.randomUUID().replace(/-/g, "");
        sessionStorage.setItem("st_sid", sessionId);
      }
      visitorId = localStorage.getItem("st_vid") || "";
      if (!visitorId) {
        visitorId = crypto.randomUUID().replace(/-/g, "");
        localStorage.setItem("st_vid", visitorId);
      }
    } catch {
      return;
    }

    // Debounce: skip if we already logged this exact path within the last
    // 800ms. Handles StrictMode double-invocation + rapid re-renders that
    // don't actually change the URL.
    const lastKey = "__st_last_pv";
    const lastRaw = sessionStorage.getItem(lastKey) || "";
    const [lastPath, lastTs] = lastRaw.split("|");
    if (lastPath === pathname && Date.now() - Number(lastTs || 0) < 800) return;
    sessionStorage.setItem(lastKey, `${pathname}|${Date.now()}`);

    fetch("/api/pv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || "",
        session_id: sessionId,
        visitor_id: visitorId,
      }),
      keepalive: true,
    }).catch(() => {
      // Silent failure — analytics loss shouldn't ever affect UX.
    });
  }, [pathname]);
}

export default function Layout({ children }: { children: ReactNode }) {
  useRevealOnScroll();
  usePageviewBeacon();

  return (
    <>
      {/* Global schema: LocalBusiness, Organization, WebSite on every page */}
      <JsonLd data={[localBusinessSchema(), organizationSchema(), websiteSchema()]} />
      <Nav />
      <main>{children}</main>
      <Footer />
    </>
  );
}
