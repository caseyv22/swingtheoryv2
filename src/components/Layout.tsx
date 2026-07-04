import { useEffect, type ReactNode } from "react";
import Nav from "./Nav";
import Footer from "./Footer";
import JsonLd from "./JsonLd";
import { localBusinessSchema, organizationSchema, websiteSchema } from "@/schema";

// Global reveal-on-scroll hook (matches mockup)
function useRevealOnScroll() {
  useEffect(() => {
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
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  });
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
