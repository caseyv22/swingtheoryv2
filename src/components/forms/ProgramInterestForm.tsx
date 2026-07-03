import { useState, type FormEvent } from "react";
import FormShell from "./FormShell";
import { TextInput, TextArea, Honeypot } from "./FormField";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { programInterestSchema } from "@/lib/validation";

export default function ProgramInterestForm({ program }: { program: string }) {
  const { status, error, submit } = useFormSubmit<Record<string, unknown>>(
    "/api/program-interest",
  );
  const [fieldError, setFieldError] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    (data as Record<string, unknown>).program = program;
    const parsed = programInterestSchema.safeParse(data);
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
      submitLabel={`Request ${program} info`}
      successMessage="Thanks. We'll follow up with details on this program."
    >
      <Honeypot />
      <div className="grid md:grid-cols-2 gap-4">
        <TextInput label="Name" name="name" required error={fieldError.name} />
        <TextInput label="Email" name="email" type="email" required error={fieldError.email} />
      </div>
      <TextInput label="Phone" name="phone" type="tel" error={fieldError.phone} />
      <TextArea label="Anything we should know?" name="message" />
    </FormShell>
  );
}
