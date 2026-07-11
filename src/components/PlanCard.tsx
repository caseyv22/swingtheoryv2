import { site } from "@/data/site-config";
import type { MembershipPlan } from "@/data/memberships";
import Button from "./Button";
import { cn } from "@/lib/cn";

type Props = {
  plan: MembershipPlan;
  onInterest?: () => void;
  onLeague?: () => void;
};

// Public toggle: mirrors backend MEMBERSHIP_PROMO_ENABLED. Both must be
// "true" for the promo to be live end-to-end (frontend copy + real Square
// charge). If they drift, we'd either advertise a promo Square isn't
// applying OR silently apply a discount without telling the customer.
// Setting/unsetting requires a redeploy of wrangler.toml.
const PROMO_ENABLED = import.meta.env.VITE_MEMBERSHIP_PROMO_ENABLED === "true";

export default function PlanCard({ plan, onInterest, onLeague }: Props) {
  const featured = plan.featured;
  const showPromo =
    PROMO_ENABLED &&
    plan.ctaTarget === "checkout" &&
    !!plan.squarePromoPlanVariationId;

  const displayPriceLabel = showPromo && plan.promoPriceLabel
    ? plan.promoPriceLabel
    : plan.priceLabel;
  const displayPriceSub = showPromo && plan.promoPriceSub
    ? plan.promoPriceSub
    : plan.priceSub;

  return (
    <div
      className={cn(
        "reveal rounded-2xl p-8 text-white transition duration-300 border",
        featured
          ? "border-gold bg-gradient-to-b from-gold/15 to-gold/[0.03]"
          : "border-white/12 bg-white/[0.04] hover:-translate-y-1 hover:border-gold/50",
      )}
    >
      {showPromo && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/60 bg-gold/10 px-3 py-1 font-disp text-[11px] tracking-[0.14em] uppercase text-gold">
          50% off first month
        </div>
      )}
      <h3 className="text-2xl">{plan.name}</h3>
      <p className="text-[#b9bdb0] text-sm mt-1">{plan.headline}</p>
      <div className="font-disp text-[2.6rem] font-extrabold text-gold mt-3 leading-none">
        {displayPriceLabel}
        {displayPriceSub && (
          <small className="text-sm text-[#b9bdb0] font-normal ml-1">
            {displayPriceSub}
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
      {plan.ctaTarget === "checkout" && (
        <Button to={`/memberships/checkout?plan=${plan.slug}`} variant="gold">
          {plan.ctaLabel}
        </Button>
      )}
    </div>
  );
}
