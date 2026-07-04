import { useState, type FormEvent } from "react";
import FormShell from "./FormShell";
import { TextInput, TextArea, Select, Honeypot } from "./FormField";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { membershipInterestSchema } from "@/lib/validation";

// Membership onboarding is human. This form collects interest;
// a team member follows up manually.
export default function MembershipInterestForm() {
  const { status, error, submit } = useFormSubmit<Record<string, unknown>>(
    "/api/membership-interest",
  );
  const [fieldError, setFieldError] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = membershipInterestSchema.safeParse(data);
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
      submitLabel="Request membership info"
      successMessage="Thanks, a team member will reach out to walk through membership options."
    >
      <Honeypot />
      <div className="grid md:grid-cols-2 gap-4">
        <TextInput label="First name" name="firstName" required error={fieldError.firstName} />
        <TextInput label="Last name" name="lastName" required error={fieldError.lastName} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <TextInput label="Email" name="email" type="email" required error={fieldError.email} />
        <TextInput label="Phone" name="phone" type="tel" error={fieldError.phone} />
      </div>
      <Select label="Which plan sounds right?" name="interest" defaultValue="Green Jacket Solo">
        <option>Green Jacket Solo</option>
        <option>Green Jacket Group</option>
      </Select>
      <TextArea label="Anything you want us to know?" name="message" />
    </FormShell>
  );
}
