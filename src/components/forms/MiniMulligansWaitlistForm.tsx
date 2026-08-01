import { useEffect, useState, type FormEvent } from "react";
import FormShell from "./FormShell";
import { TextInput, Honeypot } from "./FormField";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { miniMulligansWaitlistSchema } from "@/lib/validation";

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
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = miniMulligansWaitlistSchema.safeParse(data);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[i.path.join(".")] = i.message));
      setFieldError(errs);
      return;
    }
    setFieldError({});
    await submit(parsed.data);
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
        <p className="text-muted">Loading waitlist…</p>
      </div>
    );
  }

  if (state?.isFull) {
    return (
      <div className="rounded-2xl border border-green-700/20 bg-green-700/5 p-8 text-center">
        <div className="font-disp text-2xl text-green-700 mb-2">
          Waitlist is full.
        </div>
        <p className="text-muted">
          All {state.capacity} early-access spots are taken. Email{" "}
          <a
            href="mailto:info@swingtheory.golf"
            className="text-green-700 underline hover:text-green-800"
          >
            info@swingtheory.golf
          </a>{" "}
          to be added to the overflow list, we'll reach out if a spot opens up
          or when we open the next cohort.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Fixed urgency copy rather than a live count. A real number cuts
          both ways: "2 of 18 left" pressures, but "15 of 18 left" reads as
          nobody wants this, and the number moves in the wrong direction
          early in a launch. The deadline does the work instead. Update the
          date here when registration is extended — it is intentionally not
          derived from the capacity state below. */}
      <p className="text-sm text-muted mb-4">
        <span className="font-semibold text-green-700">
          Only limited slots left.
        </span>{" "}
        Book your spot now before it's gone! Registration ends 8/3
      </p>
      <FormShell
        onSubmit={onSubmit}
        status={status}
        error={error}
        submitLabel="Join the waitlist"
        successMessage="You're on the Mini Mulligans early-access list. We'll email when we open bookings, first-come first-served."
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
      </FormShell>
    </>
  );
}
