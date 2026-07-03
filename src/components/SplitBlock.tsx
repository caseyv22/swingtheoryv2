import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  imageSrc: string;
  imageAlt: string;
  imageSide?: "left" | "right";
  children: ReactNode;
  className?: string;
};

// Split section: image on one side, content on the other.
export default function SplitBlock({
  imageSrc,
  imageAlt,
  imageSide = "left",
  children,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "wrap grid gap-16 items-center",
        "md:grid-cols-[1.05fr_1fr]",
        className,
      )}
    >
      {imageSide === "left" && (
        <img
          src={imageSrc}
          alt={imageAlt}
          loading="lazy"
          className="reveal rounded-2xl w-full object-cover aspect-[4/3]"
        />
      )}
      <div className="reveal">{children}</div>
      {imageSide === "right" && (
        <img
          src={imageSrc}
          alt={imageAlt}
          loading="lazy"
          className="reveal rounded-2xl w-full object-cover aspect-[4/3] md:order-2"
        />
      )}
    </div>
  );
}

export function FeatList({ items }: { items: string[] }) {
  return (
    <ul className="list-none my-6 space-y-0">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex gap-3 py-2 border-b border-[var(--line)] text-[1.02rem]"
        >
          <span className="text-gold font-bold">◆</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
