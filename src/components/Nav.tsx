import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { site } from "@/data/site-config";
import { primaryNav } from "@/data/nav";
import Button from "./Button";

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-green-700 border-b border-white/10">
      <div className="wrap flex items-center justify-between h-[74px]">
        <Link to="/" aria-label="Swing Theory home">
          <img src="/logo.png?v=1" alt="Swing Theory" className="h-7 w-auto" />
        </Link>
        <nav className="hidden md:flex gap-8 items-center">
          {primaryNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `font-disp font-medium text-[14px] tracking-[0.04em] transition ${
                  isActive ? "text-gold" : "text-[#e8e5da] hover:text-gold"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-4">
          <a
            href={`tel:${site.phone.tel}`}
            className="text-[#e8e5da] font-disp font-semibold text-[14px]"
          >
            {site.phone.display}
          </a>
          <Button to="/book" variant="gold">
            Book a bay
          </Button>
        </div>
        <button
          className="md:hidden text-white text-2xl"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>
      {open && (
        <div className="md:hidden bg-green-700 border-t border-white/10">
          <div className="wrap flex flex-col gap-3 py-5">
            {primaryNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="font-disp text-[#e8e5da] hover:text-gold"
              >
                {item.label}
              </NavLink>
            ))}
            <a
              href={`tel:${site.phone.tel}`}
              className="font-disp text-[#e8e5da]"
            >
              {site.phone.display}
            </a>
            <Button to="/book" variant="gold" className="self-start">
              Book a bay
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
