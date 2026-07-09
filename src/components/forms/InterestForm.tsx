import { useState, type FormEvent } from "react";
import FormShell from "./FormShell";
import { TextInput, TextArea, Select, Honeypot } from "./FormField";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { usePrograms } from "@/hooks/usePrograms";
import { interestSchema } from "@/lib/validation";

type Props = {
  // Pre-selects this option in the dropdown. Falls back to the first
  // available option if omitted, or if it no longer exists (e.g. a
  // program was renamed or removed in admin).
  defaultTopic?: string;
  // Extra options appended after the live Programs list, for things that
  // aren't in the Programs table, like a membership plan.
  extraOptions?: string[];
};

// Single shared "what do you have questions about" form, used on the
// Memberships page and on any program page that isn't wired to direct
// checkout. The dropdown is built from the live, admin-editable Programs
// list (usePrograms -> /api/public/programs), so adding, renaming, or
// removing a program updates this dropdown automatically with no code
// change or deploy.
export default function InterestForm({ defaultTopic, extraOptions = [] }: Props) {
  const { programs } = usePrograms();
  const options = [...programs.map((p) => p.name), ...extraOptions];

  const { status, error, submit } = useFormSubmit<Record<string, unknown>>("/api/interest");
  const [fieldError, setFieldError] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = interestSchema.safeParse(data);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[i.path.join(".")] = i.message));
      setFieldError(errs);
      return;
    }
    setFieldError({});
    await submit(parsed.data);
  }

  const selected = defaultTopic && options.includes(defaultTopic) ? defaultTopic : options[0];

  return (
    <FormShell
      onSubmit={onSubmit}
      status={status}
      error={error}
      submitLabel="Send my question"
      successMessage="Thanks. A team member will follow up with details and next steps."
    >
      <Honeypot />
      <div className="grid md:grid-cols-2 gap-4">
        <TextInput label="Name" name="name" required error={fieldError.name} />
        <TextInput label="Email" name="email" type="email" required error={fieldError.email} />
      </div>
      <TextInput label="Phone" name="phone" type="tel" error={fieldError.phone} />
      {options.length > 0 && (
        <Select
          label="What do you have questions about?"
          name="program"
          defaultValue={selected}
          error={fieldError.program}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
      )}
      <TextArea label="Anything you want us to know?" name="message" />
    </FormShell>
  );
}
