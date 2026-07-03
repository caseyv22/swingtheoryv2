import { useState, type FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export function useFormSubmit<T extends Record<string, unknown>>(endpoint: string) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(data: T, onSuccess?: () => void) {
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Something went wrong. Please try again.");
      }
      setStatus("success");
      onSuccess?.();
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  function handleSubmit(handler: (e: FormEvent<HTMLFormElement>) => Promise<void>) {
    return async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      await handler(e);
    };
  }

  return { status, error, submit, handleSubmit, setStatus };
}
