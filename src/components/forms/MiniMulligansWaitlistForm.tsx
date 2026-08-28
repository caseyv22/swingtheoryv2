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
//
// No payment is collected here. Sign-ups used to require a card on file
// (Square) before the reservation would go through, and testing showed
// that was suppressing signups: people bailed at the card field even
// though the copy said "won't be charged." This is now a plain sign-up
// form — name, email, and the child's info. A Swing Theory team member
// reaches out afterward (see the success message + confirmation email
// in functions/lib/confirmations.ts) to confirm the spot and, if the
// family continues after the free first session, arrange payment then.
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
          Every spot for the September 22 launch is taken. Email{" "}
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
      {/* The "what you're signing up for" recap now lives in the Order
          Summary panel rendered alongside this form in ProgramDetail.tsx
          (waitlist branch), matching the other checkout pages. Keep the
          launch date / schedule / $400 / free-first details in sync across
          that panel, this form's success message, the confirmation email
          (functions/lib/confirmations.ts), and the program pills in admin. */}
      <FormShell
        onSubmit={onSubmit}
        status={status}
        error={error}
        submitLabel="Sign up for Mini Mulligans"
        successMessage="You're signed up for Mini Mulligans. Check your inbox for your confirmation. A Swing Theory team member will reach out soon to confirm your spot and answer any questions before launch day, Tuesday, September 22."
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
        <p className="text-sm text-muted">
          No payment today. A Swing Theory team member will reach out to
          confirm your sign-up.
        </p>
      </FormShell>
    </>
  );
}
