import { useEffect } from "react";
import { site } from "@/data/site-config";
import SEO from "@/components/SEO";

// Client-side handoff. Also mirrored as a Cloudflare _redirects rule so
// direct hits get a 302 without loading React first (see public/_redirects).
export default function Book() {
  useEffect(() => {
    window.location.replace(site.bookingUrl);
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
