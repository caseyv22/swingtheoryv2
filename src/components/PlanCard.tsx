import { site } from "@/data/site-config";
import type { MembershipPlan } from "@/data/memberships";
import Button from "./Button";
import { cn } from "@/lib/cn";

type Props = {
  plan: MembershipPlan;
  onInterest?: () => void;
  onLeague?: () => void;
};

export default function PlanCard({ plan, onInterest, onLeague }: Props) {
  const featured = plan.featured;
  return (
    <div
      className={cn(
        "reveal rounded-2xl p-8 text-white transition duration-300 border",
        featured
          ? "border-gold bg-gradient-to-b from-gold/15 to-gold/[0.03]"
          : "border-white/12 bg-white/[0.04] hover:-translate-y-1 hover:border-gold/50",
      )}
    >
      {featured && (
        <span className="inline-block font-disp text-[11px] tracking-[0.18em] uppercase text-[#241c05] bg-gold px-3 py-1 rounded-full mb-4">
          Founding member
        </span>
      )}
      <h3 className="text-2xl">{plan.name}</h3>
      <p className="text-[#b9bdb0] text-sm mt-1">{plan.headline}</p>
      <div className="font-disp text-[2.6rem] font-extrabold text-gold mt-3 leading-none">
        {plan.priceLabel}
        {plan.priceSub && (
          <small className="text-sm text-[#b9bdb0] font-normal ml-1">
            {plan.priceSub}
          </small>
        )}
      </div>
      <ul className="list-none my-6 space-y-2">
        {plan.perks.map((p, i) => (
          <li
            key={i}
            className="flex gap-2 items-start text-[#dcdccf] text-[0.96rem]"
          >
            <span className="text-gold font-bold shrink-0">✓</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
      {plan.ctaTarget === "book" && (
        <Button href={site.bookingUrl} external variant="ghost-gold">
          {plan.ctaLabel}
        </Button>
      )}
      {plan.ctaTarget === "interest" && (
        <Button onClick={onInterest} variant="gold">
          {plan.ctaLabel}
        </Button>
      )}
      {plan.ctaTarget === "league" && (
        <Button onClick={onLeague} variant="ghost-gold">
          {plan.ctaLabel}
        </Button>
      )}
    </div>
  );
}
