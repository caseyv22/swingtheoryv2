import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Nav from "./Nav";
import Footer from "./Footer";
import JsonLd from "./JsonLd";
import { localBusinessSchema, organizationSchema, websiteSchema } from "@/schema";

// Global reveal-on-scroll hook (matches mockup).
//
// Bug fixed here: this effect previously had no dependency array, so it
// tore down and rebuilt the IntersectionObserver on every render (not just
// on navigation). That churn could race with the observer's first
// callback and leave ".reveal" sections stuck at opacity:0 indefinitely,
// looking like the section "never loaded" until a hard refresh happened
// to land cleanly. Fixed by keying the effect to the route pathname
// (rebuild once per page, not once per render) and adding a hard timeout
// fallback so content can never stay invisible if IntersectionObserver is
// unavailable or something upstream stalls.
function useRevealOnScroll() {
  const { pathname } = useLocation();

  useEffect(() => {
    const revealEls = Array.from(
      document.querySelectorAll<HTMLElement>(".reveal"),
    );
    if (revealEls.length === 0) return;

    // Safety net: force every section visible after 1.2s no matter what.
    // This guarantees content can never be permanently hidden by a stalled
    // or unsupported IntersectionObserver.
    const fallback = window.setTimeout(() => {
      revealEls.forEach((el) => el.classList.add("in"));
    }, 1200);

    if (typeof IntersectionObserver === "undefined") {
      revealEls.forEach((el) => el.classList.add("in"));
      return () => window.clearTimeout(fallback);
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    revealEls.forEach((el) => io.observe(el));

    return () => {
      window.clearTimeout(fallback);
      io.disconnect();
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
