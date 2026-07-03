import type { ReactNode } from "react";
import Button from "@/components/Button";

type Props = {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  status: "idle" | "submitting" | "success" | "error";
  error: string | null;
  submitLabel: string;
  successMessage: string;
  children: ReactNode;
};

// Shared shell — handles submit state, success card, and error banner.
export default function FormShell({
  onSubmit,
  status,
  error,
  submitLabel,
  successMessage,
  children,
}: Props) {
  if (status === "success") {
    return (
      <div className="rounded-2xl border border-green-700/20 bg-green-700/5 p-8 text-center">
        <div className="font-disp text-2xl text-green-700 mb-2">Thanks — got it.</div>
        <p className="text-muted">{successMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {children}
      {error && (
        <div className="text-sm text-red-700 border border-red-200 bg-red-50 rounded-lg p-3">
          {error}
        </div>
      )}
      <div className="mt-2">
        <Button
          type="submit"
          onClick={() => {}}
          variant="dk"
        >
          {status === "submitting" ? "Sending…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
