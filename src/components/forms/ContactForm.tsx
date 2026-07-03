import { useState, type FormEvent } from "react";
import FormShell from "./FormShell";
import { TextInput, TextArea, Honeypot } from "./FormField";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { contactSchema } from "@/lib/validation";

export default function ContactForm() {
  const { status, error, submit } = useFormSubmit<Record<string, unknown>>("/api/contact");
  const [fieldError, setFieldError] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = contactSchema.safeParse(data);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        errs[i.path.join(".")] = i.message;
      });
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
      submitLabel="Send message"
      successMessage="We'll be in touch shortly at the email you provided."
    >
      <Honeypot />
      <div className="grid md:grid-cols-2 gap-4">
        <TextInput label="Name" name="name" required error={fieldError.name} />
        <TextInput
          label="Email"
          name="email"
          type="email"
          required
          error={fieldError.email}
        />
      </div>
      <TextInput label="Phone" name="phone" type="tel" error={fieldError.phone} />
      <TextArea label="Message" name="message" required error={fieldError.message} />
    </FormShell>
  );
}
