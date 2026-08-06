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
      {/* "What you're signing up for" recap sits directly above the fields so
          the registration intent is unmistakable at the point of action —
          this is the fix for signups who thought the old "early access"
          button just meant "notify me." No live spot count on purpose: a
          real number cuts both ways early in a launch, and Casey asked not to
          display the cap. The date does the urgency work. Keep these details
          in sync with the confirmation email (functions/lib/confirmations.ts)
          and the program pills in the admin panel. */}
      <div className="rounded-2xl border border-line bg-cream/60 p-5 mb-6">
        <p className="font-disp text-green-700 font-semibold mb-2">
          What you're signing up for
        </p>
        <ul className="text-sm text-ink/90 space-y-1.5">
          <li>
            <span className="font-semibold">Launch day:</span> Tuesday,
            September 8
          </li>
          <li>
            <span className="font-semibold">Schedule:</span> Tuesdays &amp;
            Thursdays, 4:30–6:00 PM
          </li>
          <li>
            <span className="font-semibold">Ages:</span> 6–13
          </li>
          <li>
            <span className="font-semibold">Your first session is free.</span>{" "}
            $400/month after launch, only if you continue. Nothing due today.
          </li>
        </ul>
      </div>
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
      </FormShell>
    </>
  );
}
