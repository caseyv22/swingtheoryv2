import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import Button from "@/components/Button";
import { TextInput } from "@/components/forms/FormField";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { useSquareCard } from "@/hooks/useSquareCard";
import { site } from "@/data/site-config";
import { membershipPlans } from "@/data/memberships";
import { membershipCheckoutSchema } from "@/lib/validation";

// Fields the person types in; planSlug + sourceId get added right before
// the API call (sourceId only exists once the card is tokenized).
const clientFieldsSchema = membershipCheckoutSchema.omit({ sourceId: true, planSlug: true });

function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export default function MembershipCheckout() {
  const [params] = useSearchParams();
  const slug = params.get("plan") ?? "";
  const plan = useMemo(() => membershipPlans.find((p) => p.slug === slug), [slug]);

  const startDateLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    [],
  );
  const renewalDay = useMemo(() => ordinal(new Date().getDate()), []);

  const { status, error, submit } = useFormSubmit<Record<string, unknown>>(
    "/api/membership-checkout",
  );
  const [fieldError, setFieldError] = useState<Record<string, string>>({});
  const [tokenizeError, setTokenizeError] = useState<string | null>(null);
  const [tokenizing, setTokenizing] = useState(false);
  const { status: cardStatus, error: cardError, tokenize } = useSquareCard("sq-card-container");

  const busy = tokenizing || status === "submitting";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || !plan) return;

    const raw = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = clientFieldsSchema.safeParse(raw);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[i.path.join(".")] = i.message));
      setFieldError(errs);
      return;
    }
    setFieldError({});
    setTokenizeError(null);

    setTokenizing(true);
    try {
      const sourceId = await tokenize();
      await submit({ ...parsed.data, planSlug: plan.slug, sourceId });
    } catch (err) {
      setTokenizeError(err instanceof Error ? err.message : "Card details couldn't be verified.");
    } finally {
      setTokenizing(false);
    }
  }

  if (!plan?.squarePlanVariationId) {
    return (
      <section className="py-24">
        <div className="wrap max-w-xl text-center reveal">
          <span className="kicker">Memberships</span>
          <h1 className="text-[clamp(1.8rem,4vw,2.6rem)] text-green-700 mt-3 mb-4">
            That plan isn't available for checkout yet.
          </h1>
          <p className="text-muted mb-6">
            Pick a plan from the memberships page to get started, or reach out and we'll walk you
            through it.
          </p>
          <Button to="/memberships" variant="dk">
            Back to memberships
          </Button>
        </div>
      </section>
    );
  }

  if (status === "success") {
    return (
      <section className="py-24">
        <div className="wrap max-w-xl text-center reveal">
          <div className="rounded-2xl border border-green-700/20 bg-green-700/5 p-10">
            <div className="font-disp text-2xl text-green-700 mb-2">Welcome to the club.</div>
            <p className="text-muted mb-6">
              Your {plan.name} membership is active. A confirmation is on its way to your email,
              and a team member will follow up to get you set up on your first visit.
            </p>
            <Button to="/visit" variant="dk">
              Plan your first visit
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <SEO
        title={`Join ${plan.name} | Swing Theory Memberships`}
        description={`Complete your ${plan.name} membership signup for Swing Theory Indoor Golf in Old Town Pasadena.`}
        path="/memberships/checkout"
        noIndex
      />

      <section className="bg-green-900 py-16">
        <div className="wrap reveal">
          <span className="kicker text-gold">Membership checkout</span>
          <h1 className="text-[clamp(2rem,4vw,3rem)] text-white mt-3">
            Complete your membership.
          </h1>
          <p className="text-[#b9bdb0] mt-2 max-w-[60ch]">
            Review your plan and enter your details below. Your card is charged after you
            confirm.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="wrap grid gap-10 md:grid-cols-[1.2fr_1fr] items-start">
          <div className="reveal order-2 md:order-1">
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <TextInput
                  label="First name"
                  name="firstName"
                  required
                  error={fieldError.firstName}
                />
                <TextInput label="Last name" name="lastName" required error={fieldError.lastName} />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <TextInput
                  label="Email"
                  name="email"
                  type="email"
                  required
                  error={fieldError.email}
                />
                <TextInput label="Phone" name="phone" type="tel" error={fieldError.phone} />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="font-disp font-semibold text-sm text-green-700">
                    Card details <span className="text-gold">*</span>
                  </label>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-disp font-semibold uppercase tracking-wide text-green-700 bg-green-700/10 border border-green-700/15 rounded-full px-2.5 py-1">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-3.5 h-3.5"
                      aria-hidden="true"
                    >
                      <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    Secure
                  </span>
                </div>
                <div
                  id="sq-card-container"
                  className="w-full rounded-lg border border-line bg-white px-4 py-3 min-h-[56px]"
                />
                {cardStatus === "loading" && (
                  <p className="text-sm text-muted">Loading payment form…</p>
                )}
                {cardError && <p className="text-sm text-red-700">{cardError}</p>}
              </div>

              {(tokenizeError || error) && (
                <div className="text-sm text-red-700 border border-red-200 bg-red-50 rounded-lg p-3">
                  {tokenizeError || error}
                </div>
              )}

              <div className="mt-2">
                <Button type="submit" onClick={() => {}} variant="dk">
                  {busy
                    ? "Processing…"
                    : `Join for ${plan.priceLabel}${plan.priceSub ?? ""}`}
                </Button>
              </div>
              <p className="text-xs text-muted">
                By joining you agree to recurring monthly billing until you cancel. Payments are
                processed securely by Square, we never see or store your card number.
              </p>
            </form>
          </div>

          {/* Order Summary, right column on desktop, top on mobile. Purely
              informational; the form on the left is the interactive column.
              Kept minimal per product intent: Selected Plan, name,
              description, and the amount charged today. */}
          <aside className="reveal order-1 md:order-2 rounded-2xl border border-gold bg-gradient-to-b from-gold/15 to-gold/[0.03] p-8 md:sticky md:top-24">
            <h2 className="font-disp text-xl text-green-700 tracking-wide uppercase mb-6">
              Order Summary
            </h2>
            <div className="border-t border-line pt-5">
              <span className="kicker">Selected plan</span>
              <div className="font-disp text-2xl text-green-700 mt-2">{plan.name}</div>
              <p className="text-muted text-sm mt-2 leading-relaxed">{plan.headline}</p>
            </div>
            <div className="mt-6 pt-5 border-t border-line flex items-baseline justify-between gap-3">
              <span className="font-disp font-semibold text-sm text-ink uppercase tracking-wide">
                Due today
              </span>
              <span className="font-disp text-[1.8rem] font-extrabold text-gold-dk leading-none">
                {plan.priceLabel}
              </span>
            </div>
            <p className="text-xs text-muted mt-3 text-right">
              Then {plan.priceLabel}
              {plan.priceSub ?? "/ month"}, starts {startDateLabel}, renews on the {renewalDay}.
            </p>
            <p className="text-xs text-muted mt-6 pt-4 border-t border-line">
              Cancel anytime, email {site.email} or call {site.phone.display}.
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
