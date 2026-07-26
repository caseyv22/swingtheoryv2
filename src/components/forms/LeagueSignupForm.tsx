import { useState, type FormEvent } from "react";
import FormShell from "./FormShell";
import { TextInput, TextArea, Select, Honeypot } from "./FormField";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { leagueSignupSchema } from "@/lib/validation";
import { site } from "@/data/site-config";

export default function LeagueSignupForm() {
  const { status, error, submit } = useFormSubmit<Record<string, unknown>>(
    "/api/league-signup",
  );
  const [fieldError, setFieldError] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = leagueSignupSchema.safeParse(data);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[i.path.join(".")] = i.message));
      setFieldError(errs);
      return;
    }
    setFieldError({});
    await submit(parsed.data);
  }

  return (
    <FormShell
      onSubmit={onSubmit}
      status={status}
      error={error}
      submitLabel="Sign up for the league"
      successMessage="You're on the list. We'll email league details before the next season kicks off."
      successExtra={
        <a
          href={site.syncUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-dk inline-flex"
        >
          Sign in to Sync
        </a>
      }
    >
      <Honeypot />
      <div className="grid md:grid-cols-2 gap-4">
        <TextInput label="Name" name="name" required error={fieldError.name} />
        <TextInput label="Email" name="email" type="email" required error={fieldError.email} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <TextInput label="Phone" name="phone" type="tel" error={fieldError.phone} />
        <TextInput label="Handicap (if known)" name="handicap" placeholder="e.g. 12" error={fieldError.handicap} />
      </div>
      <Select label="Team preference" name="teamPreference" defaultValue="Solo (place me on a team)">
        <option>Solo (place me on a team)</option>
        <option>I have a team</option>
        <option>Not sure yet</option>
      </Select>
      <TextArea label="Anything else?" name="message" />
    </FormShell>
  );
}
