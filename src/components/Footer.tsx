import { Link } from "react-router-dom";
import { site } from "@/data/site-config";
import { footerNav } from "@/data/nav";
import InstagramIcon from "./InstagramIcon";

export default function Footer() {
  return (
    <footer className="bg-green-900 text-[#a9ad9f] pt-16 pb-8">
      <div className="wrap">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr] pb-10 border-b border-white/10">
          <div>
            <img
              src="/logo.png?v=1"
              alt="Swing Theory"
              className="h-6 w-auto mb-4"
            />
            <p className="max-w-[34ch] text-[0.95rem]">
              Indoor golf and golf simulators in Old Town Pasadena. Practice,
              play, and host events, seven days a week.
            </p>
            <p className="mt-4 text-white font-disp text-[0.95rem]">
              {site.address.street}
              <br />
              {site.address.city}, {site.address.region} {site.address.postalCode}
            </p>
            <a
              href={site.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 font-disp text-[0.95rem] hover:text-gold transition"
              aria-label="Swing Theory on Instagram"
            >
              <InstagramIcon /> {site.socials.instagramHandle}
            </a>
          </div>
          {Object.entries(footerNav).map(([heading, items]) => (
            <div key={heading}>
              <h4 className="font-disp text-white text-[14px] tracking-[0.14em] uppercase mb-4">
                {heading}
              </h4>
              {items.map((it) =>
                it.external ? (
                  <a
                    key={it.to}
                    href={it.to}
                    className="block py-1 text-[0.95rem] hover:text-gold transition"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {it.label}
                  </a>
                ) : (
                  <Link
                    key={it.to}
                    to={it.to}
                    className="block py-1 text-[0.95rem] hover:text-gold transition"
                  >
                    {it.label}
                  </Link>
                ),
              )}
              {heading === "Book" && (
                <a
                  href={`tel:${site.phone.tel}`}
                  className="block py-1 text-[0.95rem] hover:text-gold transition"
                >
                  {site.phone.display}
                </a>
              )}
              {heading === "Visit" && (
                <a
                  href={`mailto:${site.email}`}
                  className="block py-1 text-[0.95rem] hover:text-gold transition"
                >
                  {site.email}
                </a>
              )}
            </div>
          ))}
        </div>
        <div className="pt-6 flex flex-wrap justify-between gap-3 text-[0.85rem] text-[#7f8377]">
          <span>© {new Date().getFullYear()} {site.legalName}. All rights reserved.</span>
          <span>Old Town Pasadena · Indoor Golf &amp; Simulators</span>
        </div>
      </div>
    </footer>
  );
}
