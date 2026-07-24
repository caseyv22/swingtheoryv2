import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import { trackClick } from "@/lib/analytics";
import { site } from "@/data/site-config";

type Variant = "gold" | "ghost" | "ghost-gold" | "dk";

// Auto-track clicks on any external link that points at the RegistryGolf
// booking URL. Detected by href — no per-caller wiring needed. If a new
// external CTA needs tracking, either give the Button a `trackLabel`
// prop (below) or add another URL prefix match here.
function autoLabelFor(href: string): string | null {
  if (href === site.bookingUrl || href.startsWith(site.bookingUrl)) {
    return "book_a_bay";
  }
  return null;
}

type Common = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
};

type ButtonProps =
  | (Common & { to: string; href?: never; onClick?: never; type?: never })
  | (Common & {
      href: string;
      to?: never;
      external?: boolean;
      onClick?: never;
      type?: never;
    })
  | (Common & {
      onClick?: () => void;
      type?: "button" | "submit";
      to?: never;
      href?: never;
    });

const variantClass: Record<Variant, string> = {
  gold: "btn-gold",
  ghost: "btn-ghost",
  "ghost-gold": "btn-ghost-gold",
  dk: "btn-dk",
};

export default function Button(props: ButtonProps) {
  const { variant = "gold", className, children } = props;
  const classes = cn("btn", variantClass[variant], className);

  if ("to" in props && props.to) {
    return (
      <Link to={props.to} className={classes}>
        {children}
      </Link>
    );
  }
  if ("href" in props && props.href) {
    const href = props.href;
    const label = autoLabelFor(href);
    return (
      <a
        href={href}
        className={classes}
        target={props.external ? "_blank" : undefined}
        rel={props.external ? "noopener noreferrer" : undefined}
        onClick={label ? () => trackClick(label, href) : undefined}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      type={"type" in props ? props.type ?? "button" : "button"}
      onClick={"onClick" in props ? props.onClick : undefined}
      className={classes}
    >
      {children}
    </button>
  );
}
