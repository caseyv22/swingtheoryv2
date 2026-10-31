import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import Button from "@/components/Button";
import { TextInput } from "@/components/forms/FormField";
import WaiverBox, { EMPTY_WAIVER_STATE, type WaiverData, type WaiverState } from "@/components/WaiverBox";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { useSquareCard } from "@/hooks/useSquareCard";
import { useRangeKeyEnabled } from "@/hooks/useRangeKeyEnabled";
import { site } from "@/data/site-config";
import { rangeKeyOptions } from "@/data/memberships";
import { rangeKeyCheckoutSchema } from "@/lib/rangekey";

// Fields the person types in; optionSlug + sourceId are added right before the API call
// (sourceId only exists once the card is tokenized).
const clientFieldsSchema = rangeKeyCheckoutSchema.omit({ sourceId: true, optionSlug: true, waiver: true });

export default function RangeKeyCheckout() {
  const [params] = useSearchParams();
  const option = rangeKeyOptions.find((o) => o.slug === (params.get("option") ?? ""));
  const enabled = useRangeKeyEnabled();

  // Liability waiver, loaded from SwingRes through our own API (same flow as /book).
  const [waiver, setWaiver] = useState<WaiverData | null>(null);
  const [waiverLoadError, setWaiverLoadError] = useState<string | null>(null);
  const [waiverState, setWaiverState] = useState<WaiverState>(EMPTY_WAIVER_STATE);
  useEffect(() => {
    if (enabled !== true) return;
    let cancelled = false;
    fetch("/api/rangekey-waiver")
      .then(async (r) => {
        const d = (await r.json().catch(() => null)) as
          | (Partial<WaiverData> & { enabled?: boolean; error?: string })
          | null;
        if (cancelled) return;
        if (!r.ok || !d?.contentId || !d.bodyText) {
          setWaiverLoadError(d?.error ?? "The waiver couldn't be loaded. Please reload the page.");
          return;
        }
        setWaiver({ contentId: d.contentId, versionNumber: d.versionNumber ?? 0, bodyText: d.bodyText });
      })
      .catch(() => {
        if (!cancelled) setWaiverLoadError("The waiver couldn't be loaded. Please reload the page.");
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const { status, error, submit } = useFormSubmit<Record<string, unknown>>("/api/rangekey-checkout");
  const [fieldError, setFieldError] = useState<Record<string, string>>({});
  const [tokenizeError, setTokenizeError] = useState<string | null>(null);
  const [tokenizing, setTokenizing] = useState(false);
  const { status: cardStatus, error: cardError, tokenize } = useSquareCard("sq-card-container");

  const busy = tokenizing || status === "submitting";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || !option) return;

    const raw = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = clientFieldsSchema.safeParse(raw);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[i.path.join(".")] = i.message));
      setFieldError(errs);
      return;
    }
    // The waiver comes first: nothing is tokenized or charged until it is read and ticked.
    if (!waiver) {
      setTokenizeError(waiverLoadError ?? "The waiver is still loading. Please try again in a moment.");
      return;
    }
    if (!waiverState.agreed) {
      setFieldError({ waiver: "Please read the waiver to the end and tick the box to continue." });
      return;
    }
    setFieldError({});
    setTokenizeError(null);

    setTokenizing(true);
    try {
      const sourceId = await tokenize();
      await submit({
        ...parsed.data,
        optionSlug: option.slug,
        sourceId,
        waiver: {
          waiverContentId: waiver.contentId,
          openedAt: waiverState.openedAt,
          scrollCompletedAt: waiverState.scrollCompletedAt,
          agreed: true,
        },
      });
    } catch (err) {
      setTokenizeError(err instanceof Error ? err.message : "Card details couldn't be verified.");
    } finally {
      setTokenizing(false);
    }
  }

  // Still asking the server whether checkout is on; don't flash "not available".
  if (enabled === null && option) return null;

  if (!option || enabled !== true) {
    return (
      <section className="py-24">
        <div className="wrap max-w-xl text-center reveal">
          <span className="kicker">Memberships</span>
          <h1 className="text-[clamp(1.8rem,4vw,2.6rem)] text-green-700 mt-3 mb-4">
            RangeKey isn't available for online checkout yet.
          </h1>
          <p className="text-muted mb-6">
            Send us a note from the memberships page, or call {site.phone.display}, and we'll get
            you set up.
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
            <div className="font-disp text-2xl text-green-700 mb-2">Your {option.name} is ready.</div>
            <p className="text-muted mb-6">
              {option.hours} hours of bay time, no expiration. A confirmation is on its way to your
              email, along with a separate email to set up your online account so you can see your
              hours and book your bays. If you don't see it in a few minutes, call{" "}
              {site.phone.display}.
            </p>
            <Button href={site.bookingUrl} external variant="dk">
              Book a bay
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <SEO
        title={`Get ${option.name} | Swing Theory Memberships`}
        description={`Complete your ${option.name} purchase for Swing Theory Indoor Golf in Old Town Pasadena.`}
        path="/memberships/rangekey"
        noIndex
      />

      <section className="bg-green-900 py-16">
        <div className="wrap reveal">
          <span className="kicker text-gold">RangeKey checkout</span>
          <h1 className="text-[clamp(2rem,4vw,3rem)] text-white mt-3">Complete your purchase.</h1>
          <p className="text-[#b9bdb0] mt-2 max-w-[60ch]">
            Enter your details below. Your card is charged once you confirm, and your account is
            created right after.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="wrap grid gap-10 md:grid-cols-[1.2fr_1fr] items-start">
          <div className="reveal order-2 md:order-1">
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <TextInput label="First name" name="firstName" required error={fieldError.firstName} />
                <TextInput label="Last name" name="lastName" required error={fieldError.lastName} />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <TextInput label="Email" name="email" type="email" required error={fieldError.email} />
                <TextInput label="Phone" name="phone" type="tel" error={fieldError.phone} />
              </div>

              {waiverLoadError && (
                <div className="text-sm text-red-700 border border-red-200 bg-red-50 rounded-lg p-3">
                  {waiverLoadError}
                </div>
              )}
              {waiver && (
                <WaiverBox
                  waiver={waiver}
                  state={waiverState}
                  onChange={setWaiverState}
                  error={fieldError.waiver}
                />
              )}

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
                {cardStatus === "loading" && <p className="text-sm text-muted">Loading payment form…</p>}
                {cardError && <p className="text-sm text-red-700">{cardError}</p>}
              </div>

              {(tokenizeError || error) && (
                <div className="text-sm text-red-700 border border-red-200 bg-red-50 rounded-lg p-3">
                  {tokenizeError || error}
                </div>
              )}

              <div className="mt-2">
                <Button type="submit" onClick={() => {}} variant="dk" className="w-full justify-center">
                  {busy ? "Processing…" : `Pay ${option.priceLabel}`}
                </Button>
              </div>
              <p className="text-xs text-muted">
                This is a one-time charge. Payments are processed securely by Square, we never see
                or store your card number.
              </p>
            </form>
          </div>

          <aside className="reveal order-1 md:order-2 rounded-2xl border border-gold bg-gradient-to-b from-gold/15 to-gold/[0.03] p-8 md:sticky md:top-24">
            <h2 className="font-disp text-xl text-green-700 tracking-wide uppercase mb-6">
              Order Summary
            </h2>
            <div className="border-t border-line pt-5">
              <span className="kicker">Selected</span>
              <div className="font-disp text-2xl text-green-700 mt-2">{option.name}</div>
              <p className="text-muted text-sm mt-2 leading-relaxed">
                {option.hours} hours of bay time. Hours never expire. Use as much as you want per
                day or per week.
              </p>
            </div>
            <div className="mt-6 pt-5 border-t border-line flex items-baseline justify-between gap-3">
              <span className="font-disp font-semibold text-sm text-ink uppercase tracking-wide">
                Due today
              </span>
              <span className="font-disp text-[1.8rem] font-extrabold text-gold-dk leading-none">
                {option.priceLabel}
              </span>
            </div>
            <p className="text-xs text-muted mt-6 pt-4 border-t border-line">
              Questions? Email {site.email} or call {site.phone.display}.
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
