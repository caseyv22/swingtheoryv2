import { useState, type FormEvent } from "react";
import FormShell from "./FormShell";
import { TextInput, TextArea, Select, Honeypot } from "./FormField";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { eventsInquirySchema } from "@/lib/validation";

export default function EventInquiryForm() {
  const { status, error, submit } = useFormSubmit<Record<string, unknown>>(
    "/api/events-inquiry",
  );
  const [fieldError, setFieldError] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = eventsInquirySchema.safeParse(data);
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
      submitLabel="Send inquiry"
      successMessage="Got it. Our events team will follow up with options within one business day."
    >
      <Honeypot />
      <div className="grid md:grid-cols-2 gap-4">
        <TextInput label="Name" name="name" required error={fieldError.name} />
        <TextInput label="Email" name="email" type="email" required error={fieldError.email} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <TextInput label="Phone" name="phone" type="tel" error={fieldError.phone} />
        <TextInput label="Company (optional)" name="company" error={fieldError.company} />
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Select label="Group size" name="groupSize" defaultValue="">
          <option value="">Select…</option>
          <option>Under 10</option>
          <option>10–20</option>
          <option>20–40</option>
          <option>40+</option>
        </Select>
        <Select label="Event type" name="eventType" defaultValue="">
          <option value="">Select…</option>
          <option>Corporate</option>
          <option>Birthday</option>
          <option>Bachelor / Bachelorette</option>
          <option>Team building</option>
          <option>Private buyout</option>
          <option>Other</option>
        </Select>
        <TextInput label="Preferred date" name="eventDate" placeholder="e.g. Fri Aug 14" error={fieldError.eventDate} />
      </div>
      <TextArea label="Anything else we should know?" name="message" required error={fieldError.message} />
    </FormShell>
  );
}
