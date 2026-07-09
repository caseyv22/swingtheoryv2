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

export default function Layout({ children }: { children: ReactNode }) {
  useRevealOnScroll();

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
