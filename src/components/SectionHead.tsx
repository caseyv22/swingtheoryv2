import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  kicker?: string;
  title: string;
  intro?: ReactNode;
  align?: "left" | "center";
  dark?: boolean;
  className?: string;
};

export default function SectionHead({
  kicker,
  title,
  intro,
  align = "left",
  dark = false,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "reveal max-w-[60ch] mb-12",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {kicker && (
        <span className={cn("kicker", dark && "text-gold")}>{kicker}</span>
      )}
      <h2
        className={cn(
          "text-[clamp(2rem,4vw,3.1rem)] mt-3 mb-2",
          dark ? "text-white" : "text-green-700",
        )}
      >
        {title}
      </h2>
      {intro && (
        <p className={cn("text-[1.08rem]", dark ? "text-[#b9bdb0]" : "text-muted")}>
          {intro}
        </p>
      )}
    </div>
  );
}
