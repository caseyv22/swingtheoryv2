import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import Button from "@/components/Button";
import { TextInput } from "@/components/forms/FormField";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { useSquareCard } from "@/hooks/useSquareCard";
import { useProgram } from "@/hooks/usePrograms";
import { site } from "@/data/site-config";
import { programCheckoutSchema } from "@/lib/validation";

// Fields the person types in; programSlug + sourceId get added right
// before the API call (sourceId only exists once the card is tokenized).
const clientFieldsSchema = programCheckoutSchema.omit({ sourceId: true, programSlug: true });

export default function ProgramCheckout() {
  const [params] = useSearchParams();
  const slug = params.get("plan") ?? "";
  const { program, loading } = useProgram(slug);

  const { status, error, submit } = useFormSubmit<Record<string, unknown>>(
    "/api/program-checkout",
  );
  const [fieldError, setFieldError] = useState<Record<string, string>>({});
  const [tokenizeError, setTokenizeError] = useState<string | null>(null);
  const [tokenizing, setTokenizing] = useState(false);
  const { status: cardStatus, error: cardError, tokenize } = useSquareCard("sq-card-container");

  const busy = tokenizing || status === "submitting";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || !program) return;

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
      await submit({ ...parsed.data, programSlug: program.slug, sourceId });
    } catch (err) {
      setTokenizeError(err instanceof Error ? err.message : "Card details couldn't be verified.");
    } finally {
      setTokenizing(false);
    }
  }

  // Still fetching /api/public/programs — don't flash the "not available"
  // state before we actually know.
  if (!program && loading) return null;

  if (!program?.useCheckout) {
    return (
      <section className="py-24">
        <div className="wrap max-w-xl text-center reveal">
          <span className="kicker">Programs</span>
          <h1 className="text-[clamp(1.8rem,4vw,2.6rem)] text-green-700 mt-3 mb-4">
            That program isn't available for checkout yet.
          </h1>
          <p className="text-muted mb-6">
            Pick a program from the programs page to get started, or reach out and we'll walk you
            through it.
          </p>
          <Button to="/programs" variant="dk">
            Back to programs
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
            <div className="font-disp text-2xl text-green-700 mb-2">You're signed up.</div>
            <p className="text-muted mb-6">
              Your spot in {program.name} is confirmed. A confirmation is on its way to your
              email, and a team member will follow up with schedule and next steps.
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
        title={`Sign up: ${program.name} | Swing Theory Programs`}
        description={`Complete your ${program.name} sign-up for Swing Theory Indoor Golf in Old Town Pasadena.`}
        path="/programs/checkout"
        noIndex
      />

      <section className="bg-green-900 py-16">
        <div className="wrap reveal">
          <span className="kicker text-gold">Program checkout</span>
          <h1 className="text-[clamp(2rem,4vw,3rem)] text-white mt-3">Complete your sign-up.</h1>
          <p className="text-[#b9bdb0] mt-2 max-w-[60ch]">
            Review the program and enter your details below. Your card is charged once you
            confirm.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="wrap grid gap-10 md:grid-cols-[1fr_1.2fr] items-start">
          <div className="reveal rounded-2xl border border-gold bg-gradient-to-b from-gold/15 to-gold/[0.03] p-8">
            <span className="kicker">Selected program</span>
            <h2 className="font-disp text-2xl text-green-700 mt-2">{program.name}</h2>
            <p className="text-muted text-sm mt-1">{program.shortDescription}</p>
            {program.price && (
              <div className="font-disp text-[2.4rem] font-extrabold text-gold-dk mt-4 leading-none">
                {program.price}
              </div>
            )}
            <ul className="list-none mt-6 space-y-2">
              {program.keyDetails.map((k, i) => (
                <li key={i} className="flex gap-2 items-start text-ink text-[0.96rem]">
                  <span className="text-gold-dk font-bold shrink-0">✓</span>
                  <span>{k}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted mt-6 border-t border-line pt-4">
              One-time charge to the card below. Questions? Email {site.email} or call{" "}
              {site.phone.display}.
            </p>
          </div>

          <div className="reveal">
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
                  {busy ? "Processing…" : program.price ? `Pay ${program.price}` : "Confirm and pay"}
                </Button>
              </div>
              <p className="text-xs text-muted">
                This is a one-time charge. Payments are processed securely by Square, we never
                see or store your card number.
              </p>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
