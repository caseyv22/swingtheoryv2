import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";

type Variant = "gold" | "ghost" | "ghost-gold" | "dk";

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
    return (
      <a
        href={props.href}
        className={classes}
        target={props.external ? "_blank" : undefined}
        rel={props.external ? "noopener noreferrer" : undefined}
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
