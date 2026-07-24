import { useEffect } from "react";
import { site } from "@/data/site-config";
import SEO from "@/components/SEO";
import { trackClick } from "@/lib/analytics";

// Client-side handoff. Also mirrored as a Cloudflare _redirects rule so
// direct hits get a 302 without loading React first (see public/_redirects).
//
// This page is the funnel point for the nav "Book a bay" CTA (which uses
// <Button to="/book">, a React Router Link, so Button's auto-tracking
// helper — which only fires on the <a href={...}> variant — never sees
// it). Firing trackClick() here captures that click before we redirect.
// sendBeacon inside the effect ships the event even though window.location
// is about to change; keepalive fetch fallback covers the rare case
// sendBeacon is blocked.
export default function Book() {
  useEffect(() => {
    trackClick("book_a_bay", site.bookingUrl);
    // Small delay so sendBeacon has a scheduler tick to fire before the
    // navigation aborts pending fetches. sendBeacon is designed to survive
    // navigation, but a 50ms cushion costs nothing and eliminates a whole
    // class of "beacon didn't ship" edge cases on flaky mobile networks.
    const t = window.setTimeout(() => {
      window.location.replace(site.bookingUrl);
    }, 50);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <>
      <SEO
        title="Book a bay, Swing Theory Indoor Golf Pasadena"
        description="Reserve a simulator bay at Swing Theory Indoor Golf in Old Town Pasadena."
        path="/book"
        noIndex
      />
      <section className="py-32 text-center">
        <div className="wrap">
          <h1 className="text-3xl text-green-700 mb-3">Taking you to booking…</h1>
          <p className="text-muted mb-8">
            If you're not redirected,{" "}
            <a
              href={site.bookingUrl}
              onClick={() => trackClick("book_a_bay", site.bookingUrl)}
              className="text-green-700 underline"
              rel="noopener noreferrer"
            >
              click here to book a bay
            </a>
            .
          </p>
        </div>
      </section>
    </>
  );
}
