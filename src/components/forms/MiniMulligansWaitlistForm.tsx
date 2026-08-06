import { useEffect, useState, type FormEvent } from "react";
import FormShell from "./FormShell";
import { TextInput, Honeypot } from "./FormField";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { useSquareCard } from "@/hooks/useSquareCard";
import { miniMulligansWaitlistSchema } from "@/lib/validation";

// The card nonce (sourceId) is produced in-browser by Square's SDK, not
// typed into a field, so the client validates everything EXCEPT sourceId
// and appends it after tokenize(). Mirrors ProgramCheckout.tsx.
const clientFieldsSchema = miniMulligansWaitlistSchema.omit({ sourceId: true });

type WaitlistState = {
  count: number;
  capacity: number;
  remaining: number;
  isFull: boolean;
} | null;

// Mini Mulligans early-access waitlist form. Backend caps at 18 signups
// total (functions/api/mm-waitlist.ts). On mount we GET the current
// count so the page renders either the form (with a "N of 18 spots left"
// hint) or a "Waitlist is full" message. The POST also re-checks the
// cap, so a race between "page loaded when open" and "submit when full"
// is handled gracefully.
export default function MiniMulligansWaitlistForm() {
  const [state, setState] = useState<WaitlistState>(null);
  const [stateLoading, setStateLoading] = useState(true);
  const { status, error, submit } = useFormSubmit<Record<string, unknown>>(
    "/api/mm-waitlist",
  );
  const [fieldError, setFieldError] = useState<Record<string, string>>({});
  const [tokenizeError, setTokenizeError] = useState<string | null>(null);
  const {
    status: cardStatus,
    error: cardError,
    tokenize,
  } = useSquareCard("mm-card-container");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/mm-waitlist")
      .then((r) => r.json())
      .then((data: WaitlistState) => {
        if (!cancelled) setState(data);
      })
      .catch(() => {
        // Non-fatal, if the count fetch fails, still render the form.
        // The POST will still enforce the cap server-side.
      })
      .finally(() => {
        if (!cancelled) setStateLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTokenizeError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = clientFieldsSchema.safeParse(data);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[i.path.join(".")] = i.message));
      setFieldError(errs);
      return;
    }
    setFieldError({});

    // Tokenize the card in-browser (Square hosts the field in its own
    // iframe; the card number never touches our state or server). We only
    // get a one-time nonce back, which the API turns into a card on file.
    let sourceId: string;
    try {
      sourceId = await tokenize();
    } catch (err) {
      setTokenizeError(
        err instanceof Error ? err.message : "Card details couldn't be verified.",
      );
      return;
    }

    await submit({ ...parsed.data, sourceId });
    // If the POST reports full (409), the useFormSubmit hook exposes that
    // as an error, refetch state so the closed-list message replaces the
    // form on the next render.
    fetch("/api/mm-waitlist")
      .then((r) => r.json())
      .then((data: WaitlistState) => setState(data))
      .catch(() => {});
  }

  if (stateLoading) {
    return (
      <div className="rounded-2xl border border-line bg-paper p-8 text-center">
        <p className="text-muted">Loading registration…</p>
      </div>
    );
  }

  if (state?.isFull) {
    return (
      <div className="rounded-2xl border border-green-700/20 bg-green-700/5 p-8 text-center">
        <div className="font-disp text-2xl text-green-700 mb-2">
          This session is full.
        </div>
        <p className="text-muted">
          Every spot for the September 8 launch is taken. Email{" "}
          <a
            href="mailto:info@swingtheory.golf"
            className="text-green-700 underline hover:text-green-800"
          >
            info@swingtheory.golf
          </a>{" "}
          to get on the list for the next session. We'll reach out the moment a
          spot opens up.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* The "what you're signing up for" recap and price now live in the
          Order Summary panel rendered alongside this form in
          ProgramDetail.tsx (waitlist branch), matching the other checkout
          pages. Keep the launch date / schedule / $400 / free-first details
          in sync across that panel, this form, the confirmation email
          (functions/lib/confirmations.ts), and the program pills in admin. */}
      <FormShell
        onSubmit={onSubmit}
        status={status}
        error={error}
        submitLabel="Sign up for Mini Mulligans"
        successMessage="You're registered for Mini Mulligans. Check your inbox, we've emailed your confirmation with launch-day details for Tuesday, September 8. We can't wait to see you."
      >
        <Honeypot />
        <div className="grid md:grid-cols-2 gap-4">
          <TextInput label="Your name" name="name" required error={fieldError.name} />
          <TextInput
            label="Email"
            name="email"
            type="email"
            required
            error={fieldError.email}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <TextInput
            label="Child's name"
            name="kidName"
            required
            error={fieldError.kidName}
          />
          <TextInput
            label="Child's age"
            name="kidAge"
            type="number"
            required
            error={fieldError.kidAge}
          />
        </div>
        <TextInput label="Phone (optional)" name="phone" type="tel" error={fieldError.phone} />
        {/* Square Web Payments card element. Square hosts the actual input
            in its own iframe; we only ever receive a one-time nonce from
            tokenize(). The reassurance copy sits directly under it. */}
        <div>
          <label className="block text-sm font-semibold text-ink mb-1.5">
            Card to hold your spot
          </label>
          <div
            id="mm-card-container"
            className="w-full rounded-lg border border-line bg-white px-4 py-3 min-h-[56px]"
          />
          {cardStatus === "loading" && (
            <p className="text-sm text-muted mt-1.5">Loading secure card field…</p>
          )}
          {cardError && <p className="text-sm text-red-700 mt-1.5">{cardError}</p>}
          {tokenizeError && (
            <p className="text-sm text-red-700 mt-1.5">{tokenizeError}</p>
          )}
        </div>
        <p className="text-sm text-muted">
          Your card holds your spot. You won't be charged today.
        </p>
      </FormShell>
    </>
  );
}
